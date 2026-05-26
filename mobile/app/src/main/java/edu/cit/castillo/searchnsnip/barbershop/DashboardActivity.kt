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
import android.location.Geocoder
import java.util.Locale
import com.google.android.gms.location.LocationServices
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import edu.cit.castillo.searchnsnip.network.BarbershopSummary

class DashboardActivity : AppCompatActivity(), OnMapReadyCallback {
    private lateinit var mMap: GoogleMap
    private lateinit var sessionManager: SessionManager
    private lateinit var greetingText: TextView
    private lateinit var textSpotsAvailable: TextView
    private lateinit var textCurrentLocation: TextView
    private lateinit var fusedLocationClient: FusedLocationProviderClient
    private lateinit var barbershopAdapter: BarbershopAdapter

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

        textSpotsAvailable = findViewById(R.id.textSpotsAvailable)
        textCurrentLocation = findViewById(R.id.textCurrentLocation)
        
        val recyclerView: RecyclerView = findViewById(R.id.recyclerViewBarbershops)
        recyclerView.layoutManager = LinearLayoutManager(this)
        barbershopAdapter = BarbershopAdapter(emptyList()) { shop ->
            val intent = android.content.Intent(this, BookingActivity::class.java)
            intent.putExtra("SHOP_ID", shop.shopId)
            intent.putExtra("SHOP_NAME", shop.name)
            startActivity(intent)
        }
        recyclerView.adapter = barbershopAdapter

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
        val token = sessionManager.getAuthToken()
        if (token != null) {
            fetchBarbershops(token)
        }
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
                    
                    try {
                        val geocoder = Geocoder(this, Locale.getDefault())
                        val addresses = geocoder.getFromLocation(location.latitude, location.longitude, 1)
                        if (!addresses.isNullOrEmpty()) {
                            val address = addresses[0]
                            val locationName = address.locality ?: address.subAdminArea ?: address.adminArea ?: "Unknown Location"
                            textCurrentLocation.text = locationName
                        } else {
                            textCurrentLocation.text = "Location not found"
                        }
                    } catch (e: Exception) {
                        textCurrentLocation.text = "Location unavailable"
                    }
                } else {
                    // Fallback to a default location if device location is not available
                    val defaultLocation = LatLng(10.3157, 123.8854)
                    mMap.moveCamera(CameraUpdateFactory.newLatLngZoom(defaultLocation, 12f))
                    textCurrentLocation.text = "Cebu City"
                }
            }
        } else {
            textCurrentLocation.text = "Location permission denied"
        }
    }

    private fun fetchBarbershops(token: String) {
        ApiClient.userApiService.getBarbershops("Bearer $token")
            .enqueue(object : Callback<List<BarbershopSummary>> {
                override fun onResponse(
                    call: Call<List<BarbershopSummary>>,
                    response: Response<List<BarbershopSummary>>
                ) {
                    if (response.isSuccessful) {
                        val shops = response.body() ?: emptyList()
                        textSpotsAvailable.text = "${shops.size} spots available near you"
                        barbershopAdapter.updateData(shops)
                        
                        shops.forEach { shop ->
                            if (shop.latitude != null && shop.longitude != null) {
                                val position = LatLng(shop.latitude, shop.longitude)
                                mMap.addMarker(
                                    MarkerOptions()
                                        .position(position)
                                        .title(shop.name)
                                        .snippet(shop.address)
                                )
                            }
                        }
                    } else {
                        Log.e("Dashboard", "Failed to fetch barbershops: ${response.code()}")
                        textSpotsAvailable.text = "Failed to load spots"
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
