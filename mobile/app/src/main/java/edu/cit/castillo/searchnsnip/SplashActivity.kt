package edu.cit.castillo.searchnsnip

import android.content.Intent
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import androidx.appcompat.app.AppCompatActivity
import edu.cit.castillo.searchnsnip.network.SessionManager

class SplashActivity : AppCompatActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_splash)
        
        supportActionBar?.hide()

        val sessionManager = SessionManager(this)

        // Delay for 2 seconds and route based on authentication state.
        Handler(Looper.getMainLooper()).postDelayed({
            val destination = if (sessionManager.getAuthToken().isNullOrBlank()) {
                LoginActivity::class.java
            } else {
                DashboardActivity::class.java
            }

            val intent = Intent(this, destination)
            startActivity(intent)
            finish()
        }, 2000)
    }
}