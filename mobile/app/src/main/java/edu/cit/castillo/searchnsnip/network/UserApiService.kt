package edu.cit.castillo.searchnsnip.network

import retrofit2.Call
import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.Header
import retrofit2.http.POST

interface UserApiService {
    @POST("api/users")
    fun register(@Body request: RegisterRequest): Call<CurrentUserResponse>

    @POST("api/users/login")
    fun login(@Body request: LoginRequest): Call<LoginResponse>

    @POST("api/users/google")
    fun googleLogin(@Body tokenPayload: Map<String, String>): Call<LoginResponse>

    @GET("api/users/me")
    fun getCurrentUser(@Header("Authorization") authorization: String): Call<CurrentUserResponse>

    @GET("api/shops")
    fun getBarbershops(): Call<List<BarbershopSummary>>
}
