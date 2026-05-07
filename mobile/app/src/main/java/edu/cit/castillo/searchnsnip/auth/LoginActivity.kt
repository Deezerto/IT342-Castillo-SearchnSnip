package edu.cit.castillo.searchnsnip.auth

import android.content.Intent
import android.os.Bundle
import android.util.Patterns
import android.widget.Button
import android.widget.EditText
import android.widget.ImageView
import android.widget.TextView
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import edu.cit.castillo.searchnsnip.barbershop.DashboardActivity
import edu.cit.castillo.searchnsnip.R
import edu.cit.castillo.searchnsnip.network.ApiClient
import edu.cit.castillo.searchnsnip.network.CurrentUserResponse
import edu.cit.castillo.searchnsnip.network.LoginRequest
import edu.cit.castillo.searchnsnip.network.LoginResponse
import edu.cit.castillo.searchnsnip.network.SessionManager
import retrofit2.Call
import retrofit2.Callback
import retrofit2.Response

class LoginActivity : AppCompatActivity() {
    private lateinit var emailInput: EditText
    private lateinit var passwordInput: EditText
    private lateinit var loginButton: Button
    private lateinit var sessionManager: SessionManager

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_login)

        supportActionBar?.hide()
        sessionManager = SessionManager(this)

        if (!sessionManager.getAuthToken().isNullOrBlank()) {
            openDashboard()
            return
        }

        emailInput = findViewById(R.id.emailInput)
        passwordInput = findViewById(R.id.passwordInput)
        loginButton = findViewById(R.id.btnLogin)

        val linkRegister = findViewById<TextView>(R.id.linkRegister)
        linkRegister.setOnClickListener {
            val intent = Intent(this, RegisterActivity::class.java)
            startActivity(intent)
        }

        val backIcon = findViewById<ImageView>(R.id.backIcon)
        backIcon.setOnClickListener {
            finish()
        }

        val btnGoogle = findViewById<Button>(R.id.btnGoogle)
        btnGoogle.setOnClickListener {
            Toast.makeText(this, "Google sign-in will be added soon.", Toast.LENGTH_SHORT).show()
        }

        loginButton.setOnClickListener {
            attemptLogin()
        }
    }

    private fun attemptLogin() {
        val email = emailInput.text.toString().trim()
        val password = passwordInput.text.toString()

        emailInput.error = null

        if (email.isBlank() || password.isBlank()) {
            Toast.makeText(this, "Please enter your email and password.", Toast.LENGTH_SHORT).show()
            return
        }

        if (!Patterns.EMAIL_ADDRESS.matcher(email).matches()) {
            emailInput.error = "Please enter a valid email address."
            emailInput.requestFocus()
            return
        }

        setLoadingState(true)

        ApiClient.userApiService.login(LoginRequest(email, password))
            .enqueue(object : Callback<LoginResponse> {
                override fun onResponse(call: Call<LoginResponse>, response: Response<LoginResponse>) {
                    val token = response.body()?.token
                    if (!response.isSuccessful || token.isNullOrBlank()) {
                        setLoadingState(false)
                        Toast.makeText(
                            this@LoginActivity,
                            "Invalid credentials. Please try again.",
                            Toast.LENGTH_SHORT
                        ).show()
                        return
                    }

                    sessionManager.saveAuthToken(token)
                    fetchCurrentUserAndContinue(token)
                }

                override fun onFailure(call: Call<LoginResponse>, t: Throwable) {
                    setLoadingState(false)
                    Toast.makeText(
                        this@LoginActivity,
                        "Unable to connect to server. Please check backend status.",
                        Toast.LENGTH_LONG
                    ).show()
                }
            })
    }

    private fun fetchCurrentUserAndContinue(token: String) {
        ApiClient.userApiService.getCurrentUser("Bearer $token")
            .enqueue(object : Callback<CurrentUserResponse> {
                override fun onResponse(
                    call: Call<CurrentUserResponse>,
                    response: Response<CurrentUserResponse>
                ) {
                    val currentUser = response.body()
                    if (response.isSuccessful && currentUser != null) {
                        sessionManager.saveDisplayName(currentUser.firstName, currentUser.lastName)
                    }

                    setLoadingState(false)
                    openDashboard()
                }

                override fun onFailure(call: Call<CurrentUserResponse>, t: Throwable) {
                    setLoadingState(false)
                    openDashboard()
                }
            })
    }

    private fun setLoadingState(isLoading: Boolean) {
        loginButton.isEnabled = !isLoading
        loginButton.text = if (isLoading) "Signing in..." else "Log In"
    }

    private fun openDashboard() {
        val intent = Intent(this, DashboardActivity::class.java)
        intent.flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK
        startActivity(intent)
        finish()
    }

    override fun onDestroy() {
        if (this::loginButton.isInitialized) {
            loginButton.text = "Log In"
        }
        super.onDestroy()
    }
}
