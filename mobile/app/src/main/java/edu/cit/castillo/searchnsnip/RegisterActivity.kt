package edu.cit.castillo.searchnsnip

import android.content.Intent
import android.os.Bundle
import android.util.Patterns
import android.widget.Button
import android.widget.EditText
import android.widget.ImageView
import android.widget.TextView
import android.widget.Toast
import androidx.appcompat.app.AlertDialog
import androidx.appcompat.app.AppCompatActivity
import edu.cit.castillo.searchnsnip.network.ApiClient
import edu.cit.castillo.searchnsnip.network.CurrentUserResponse
import edu.cit.castillo.searchnsnip.network.LoginRequest
import edu.cit.castillo.searchnsnip.network.LoginResponse
import edu.cit.castillo.searchnsnip.network.RegisterRequest
import edu.cit.castillo.searchnsnip.network.SessionManager
import retrofit2.Call
import retrofit2.Callback
import retrofit2.Response

class RegisterActivity : AppCompatActivity() {
    private lateinit var emailInput: EditText
    private lateinit var firstNameInput: EditText
    private lateinit var lastNameInput: EditText
    private lateinit var passwordInput: EditText
    private lateinit var confirmPasswordInput: EditText
    private lateinit var submitButton: Button
    private lateinit var sessionManager: SessionManager

    companion object {
        private val PASSWORD_RULE_REGEX =
            Regex("^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[^A-Za-z\\d]).{8,}$")
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_register)

        supportActionBar?.hide()
        sessionManager = SessionManager(this)

        if (!sessionManager.getAuthToken().isNullOrBlank()) {
            openDashboard()
            return
        }

        emailInput = findViewById(R.id.regEmailInput)
        firstNameInput = findViewById(R.id.firstNameInput)
        lastNameInput = findViewById(R.id.lastNameInput)
        passwordInput = findViewById(R.id.regPasswordInput)
        confirmPasswordInput = findViewById(R.id.confirmPasswordInput)
        submitButton = findViewById(R.id.btnSubmit)

        val linkLogin = findViewById<TextView>(R.id.linkLogin)
        linkLogin.setOnClickListener {
            val intent = Intent(this, LoginActivity::class.java)
            intent.flags = Intent.FLAG_ACTIVITY_CLEAR_TOP or Intent.FLAG_ACTIVITY_SINGLE_TOP
            startActivity(intent)
        }

        val backIcon = findViewById<ImageView>(R.id.backIconReg)
        backIcon.setOnClickListener {
            finish()
        }

        submitButton.setOnClickListener {
            attemptRegister()
        }
    }

    private fun attemptRegister() {
        val email = emailInput.text.toString().trim()
        val firstName = firstNameInput.text.toString().trim()
        val lastName = lastNameInput.text.toString().trim()
        val password = passwordInput.text.toString()
        val confirmPassword = confirmPasswordInput.text.toString()

        emailInput.error = null
        passwordInput.error = null
        confirmPasswordInput.error = null

        if (email.isBlank() || firstName.isBlank() || lastName.isBlank() || password.isBlank()) {
            Toast.makeText(this, "Please complete all fields.", Toast.LENGTH_SHORT).show()
            return
        }

        if (!Patterns.EMAIL_ADDRESS.matcher(email).matches()) {
            emailInput.error = "Please enter a valid email address."
            emailInput.requestFocus()
            return
        }

        if (!PASSWORD_RULE_REGEX.matches(password)) {
            passwordInput.error =
                "Password must be at least 8 chars with uppercase, lowercase, number, and special symbol."
            passwordInput.requestFocus()
            return
        }

        if (password != confirmPassword) {
            confirmPasswordInput.error = "Passwords do not match."
            confirmPasswordInput.requestFocus()
            return
        }

        setLoadingState(true)

        val request = RegisterRequest(
            email = email,
            password = password,
            firstName = firstName,
            lastName = lastName
        )

        ApiClient.userApiService.register(request)
            .enqueue(object : Callback<CurrentUserResponse> {
                override fun onResponse(
                    call: Call<CurrentUserResponse>,
                    response: Response<CurrentUserResponse>
                ) {
                    if (!response.isSuccessful) {
                        setLoadingState(false)
                        Toast.makeText(
                            this@RegisterActivity,
                            "Registration failed. Email might already exist.",
                            Toast.LENGTH_LONG
                        ).show()
                        return
                    }

                    sessionManager.saveDisplayName(firstName, lastName)
                    setLoadingState(false)
                    showRegistrationSuccessDialog(email, password)
                }

                override fun onFailure(call: Call<CurrentUserResponse>, t: Throwable) {
                    setLoadingState(false)
                    Toast.makeText(
                        this@RegisterActivity,
                        "Unable to connect to server. Please check backend status.",
                        Toast.LENGTH_LONG
                    ).show()
                }
            })
    }

    private fun showRegistrationSuccessDialog(email: String, password: String) {
        AlertDialog.Builder(this)
            .setTitle("Registration Successful")
            .setMessage("Your account has been created successfully.")
            .setCancelable(false)
            .setPositiveButton("Continue") { _, _ ->
                setLoadingState(true)
                performAutoLogin(email, password)
            }
            .show()
    }

    private fun performAutoLogin(email: String, password: String) {
        ApiClient.userApiService.login(LoginRequest(email, password))
            .enqueue(object : Callback<LoginResponse> {
                override fun onResponse(call: Call<LoginResponse>, response: Response<LoginResponse>) {
                    val token = response.body()?.token
                    if (!response.isSuccessful || token.isNullOrBlank()) {
                        setLoadingState(false)
                        Toast.makeText(
                            this@RegisterActivity,
                            "Account created. Please log in manually.",
                            Toast.LENGTH_LONG
                        ).show()

                        startActivity(Intent(this@RegisterActivity, LoginActivity::class.java))
                        finish()
                        return
                    }

                    sessionManager.saveAuthToken(token)
                    setLoadingState(false)
                    openDashboard()
                }

                override fun onFailure(call: Call<LoginResponse>, t: Throwable) {
                    setLoadingState(false)
                    Toast.makeText(
                        this@RegisterActivity,
                        "Account created. Please log in manually.",
                        Toast.LENGTH_LONG
                    ).show()

                    startActivity(Intent(this@RegisterActivity, LoginActivity::class.java))
                    finish()
                }
            })
    }

    private fun setLoadingState(isLoading: Boolean) {
        submitButton.isEnabled = !isLoading
        submitButton.text = if (isLoading) "Submitting..." else "Submit"
    }

    private fun openDashboard() {
        val intent = Intent(this, DashboardActivity::class.java)
        intent.flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK
        startActivity(intent)
        finish()
    }

    override fun onDestroy() {
        if (this::submitButton.isInitialized) {
            submitButton.text = "Submit"
        }
        super.onDestroy()
    }
}