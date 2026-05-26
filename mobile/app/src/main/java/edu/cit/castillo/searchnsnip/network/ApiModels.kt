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

data class BarbershopSummary(
    val shopId: Long,
    val name: String,
    val description: String?,
    val address: String,
    val latitude: Double?,
    val longitude: Double?,
    val contactInfo: String?,
    val showcaseImages: List<String>
)

data class ServiceSummary(
    val serviceId: Long,
    val name: String,
    val description: String?,
    val price: String,
    val duration: String,
    val photo: String?,
    val category: String?
)

data class CreateBookingRequest(
    val shopId: Long,
    val serviceIds: List<Long>,
    val appointmentDate: String
)

data class BookingSummary(
    val bookingId: Long,
    val status: String,
    val totalPrice: Double,
    val appointmentDate: String?,
    val serviceIds: List<Long>
)
