package edu.cit.castillo.searchnsnip

import android.content.Intent
import android.os.Bundle
import android.widget.ImageButton
import android.widget.TextView
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import edu.cit.castillo.searchnsnip.network.ApiClient
import edu.cit.castillo.searchnsnip.network.CurrentUserResponse
import edu.cit.castillo.searchnsnip.network.SessionManager
import retrofit2.Call
import retrofit2.Callback
import retrofit2.Response

class DashboardActivity : AppCompatActivity() {
    private lateinit var sessionManager: SessionManager
    private lateinit var greetingText: TextView

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

        greetingText = findViewById(R.id.textGreeting)
        greetingText.text = buildGreeting(sessionManager.getDisplayName())

        val logoutButton = findViewById<ImageButton>(R.id.btnLogout)
        logoutButton.setOnClickListener {
            sessionManager.clearSession()
            goToLogin()
        }

        bindTemporaryMapButtons()
        fetchCurrentUser(token)
    }

    private fun bindTemporaryMapButtons() {
        val mapActionIds = listOf(
            R.id.btnCenterMap,
            R.id.btnMapLayers,
            R.id.btnMapAction1,
            R.id.btnMapAction2
        )

        mapActionIds.forEach { id ->
            findViewById<ImageButton>(id).setOnClickListener {
                Toast.makeText(this, "Temporary dashboard action", Toast.LENGTH_SHORT).show()
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
