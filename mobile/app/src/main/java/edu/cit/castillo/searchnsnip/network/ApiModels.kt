package edu.cit.castillo.searchnsnip.network

data class RegisterRequest(
    val email: String,
    val password: String,
    val firstName: String,
    val lastName: String
)

data class LoginRequest(
    val email: String,
    val password: String
)

data class LoginResponse(
    val token: String
)

data class CurrentUserResponse(
    val userId: Long,
    val email: String,
    val firstName: String,
    val lastName: String
)
