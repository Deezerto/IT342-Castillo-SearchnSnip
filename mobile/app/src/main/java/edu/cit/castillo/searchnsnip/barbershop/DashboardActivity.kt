package edu.cit.castillo.searchnsnip.barbershop

import android.content.Intent
import android.os.Bundle
import android.widget.ImageButton
import android.widget.TextView
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import edu.cit.castillo.searchnsnip.R
import edu.cit.castillo.searchnsnip.auth.LoginActivity
import edu.cit.castillo.searchnsnip.network.ApiClient
import edu.cit.castillo.searchnsnip.network.CurrentUserResponse
import edu.cit.castillo.searchnsnip.network.SessionManager
import retrofit2.Call
import retrofit2.Callback
import retrofit2.Response
import com.google.android.gms.maps.CameraUpdateFactory
import com.google.android.gms.maps.GoogleMap
import com.google.android.gms.maps.OnMapReadyCallback
import com.google.android.gms.maps.SupportMapFragment
import com.google.android.gms.maps.model.LatLng
import com.google.android.gms.maps.model.MarkerOptions
import android.Manifest
import android.content.pm.PackageManager
import android.util.Log
import androidx.activity.result.contract.ActivityResultContracts
import androidx.core.content.ContextCompat
import com.google.android.gms.location.FusedLocationProviderClient
import com.google.android.gms.location.LocationServices
import edu.cit.castillo.searchnsnip.network.BarbershopSummary

class DashboardActivity : AppCompatActivity(), OnMapReadyCallback {
    private lateinit var mMap: GoogleMap
    private lateinit var sessionManager: SessionManager
    private lateinit var greetingText: TextView
    private lateinit var fusedLocationClient: FusedLocationProviderClient

    private val requestPermissionLauncher =
        registerForActivityResult(ActivityResultContracts.RequestPermission()) { isGranted: Boolean ->
            if (isGranted) {
                enableUserLocation()
            } else {
                Toast.makeText(this, "Location permission denied", Toast.LENGTH_SHORT).show()
            }
        }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_dashboard)
        supportActionBar?.hide()

        sessionManager = SessionManager(this)
        val token = sessionManager.getAuthToken()
        if (token.isNullOrBlank()) {
            goToLogin()
            return
        }

        fusedLocationClient = LocationServices.getFusedLocationProviderClient(this)

        greetingText = findViewById(R.id.textGreeting)
        greetingText.text = buildGreeting(sessionManager.getDisplayName())

        val profileMenuBtn = findViewById<android.widget.ImageView>(R.id.btnProfileMenu)
        profileMenuBtn.setOnClickListener { view ->
            val popup = android.widget.PopupMenu(this, view)
            popup.menuInflater.inflate(R.menu.profile_menu, popup.menu)
            popup.setOnMenuItemClickListener { menuItem ->
                when (menuItem.itemId) {
                    R.id.action_profile -> {
                        Toast.makeText(this, "Profile clicked", Toast.LENGTH_SHORT).show()
                        true
                    }
                    R.id.action_my_barbershop -> {
                        Toast.makeText(this, "My Barbershop clicked", Toast.LENGTH_SHORT).show()
                        true
                    }
                    R.id.action_settings -> {
                        Toast.makeText(this, "Settings clicked", Toast.LENGTH_SHORT).show()
                        true
                    }
                    R.id.action_logout -> {
                        sessionManager.clearSession()
                        goToLogin()
                        true
                    }
                    else -> false
                }
            }
            popup.show()
        }

        val mapFragment = supportFragmentManager
            .findFragmentById(R.id.map) as SupportMapFragment
        mapFragment.getMapAsync(this)

        bindTemporaryMapButtons()
        fetchCurrentUser(token)
    }

    override fun onMapReady(googleMap: GoogleMap) {
        mMap = googleMap

        // Try to enable user location and fetch current location
        checkLocationPermissionAndEnable()

        // Fetch barbershops from the database and place pins
        fetchBarbershops()
    }

    private fun checkLocationPermissionAndEnable() {
        if (ContextCompat.checkSelfPermission(
                this,
                Manifest.permission.ACCESS_FINE_LOCATION
            ) == PackageManager.PERMISSION_GRANTED
        ) {
            enableUserLocation()
        } else {
            requestPermissionLauncher.launch(Manifest.permission.ACCESS_FINE_LOCATION)
        }
    }

    private fun enableUserLocation() {
        if (ContextCompat.checkSelfPermission(
                this,
                Manifest.permission.ACCESS_FINE_LOCATION
            ) == PackageManager.PERMISSION_GRANTED
        ) {
            mMap.isMyLocationEnabled = true
            fusedLocationClient.lastLocation.addOnSuccessListener { location ->
                if (location != null) {
                    val currentLatLng = LatLng(location.latitude, location.longitude)
                    mMap.animateCamera(CameraUpdateFactory.newLatLngZoom(currentLatLng, 13f))
                } else {
                    // Fallback to a default location if device location is not available
                    val defaultLocation = LatLng(10.3157, 123.8854)
                    mMap.moveCamera(CameraUpdateFactory.newLatLngZoom(defaultLocation, 12f))
                }
            }
        }
    }

    private fun fetchBarbershops() {
        ApiClient.userApiService.getBarbershops()
            .enqueue(object : Callback<List<BarbershopSummary>> {
                override fun onResponse(
                    call: Call<List<BarbershopSummary>>,
                    response: Response<List<BarbershopSummary>>
                ) {
                    if (response.isSuccessful) {
                        response.body()?.forEach { shop ->
                            val position = LatLng(shop.latitude, shop.longitude)
                            mMap.addMarker(
                                MarkerOptions()
                                    .position(position)
                                    .title(shop.name)
                                    .snippet(shop.address)
                            )
                        }
                    } else {
                        Log.e("Dashboard", "Failed to fetch barbershops: ${response.code()}")
                    }
                }

                override fun onFailure(call: Call<List<BarbershopSummary>>, t: Throwable) {
                    Log.e("Dashboard", "Error fetching barbershops", t)
                }
            })
    }

    private fun bindTemporaryMapButtons() {
        findViewById<ImageButton>(R.id.btnCenterMap).setOnClickListener {
            checkLocationPermissionAndEnable()
        }

        findViewById<ImageButton>(R.id.btnZoomIn).setOnClickListener {
            if (::mMap.isInitialized) {
                mMap.animateCamera(CameraUpdateFactory.zoomIn())
            }
        }

        findViewById<ImageButton>(R.id.btnZoomOut).setOnClickListener {
            if (::mMap.isInitialized) {
                mMap.animateCamera(CameraUpdateFactory.zoomOut())
            }
        }
    }

    private fun fetchCurrentUser(token: String) {
        ApiClient.userApiService.getCurrentUser("Bearer $token")
            .enqueue(object : Callback<CurrentUserResponse> {
                override fun onResponse(
                    call: Call<CurrentUserResponse>,
                    response: Response<CurrentUserResponse>
                ) {
                    val user = response.body()
                    if (response.isSuccessful && user != null) {
                        sessionManager.saveDisplayName(user.firstName, user.lastName)
                        greetingText.text = buildGreeting("${user.firstName} ${user.lastName}")
                    }
                }

                override fun onFailure(call: Call<CurrentUserResponse>, t: Throwable) {
                    // Keep the cached name if profile refresh fails.
                }
            })
    }

    private fun buildGreeting(displayName: String?): String {
        if (displayName.isNullOrBlank()) {
            return "Welcome back"
        }
        return "Welcome back, $displayName"
    }

    private fun goToLogin() {
        val intent = Intent(this, LoginActivity::class.java)
        intent.flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK
        startActivity(intent)
        finish()
    }
}
