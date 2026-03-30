package edu.cit.castillo.searchnsnip.network

import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory

object ApiClient {
    // 10.0.2.2 maps to your host machine when running on an Android emulator.
    private const val BASE_URL = "http://10.0.2.2:8080/"

    val userApiService: UserApiService by lazy {
        Retrofit.Builder()
            .baseUrl(BASE_URL)
            .addConverterFactory(GsonConverterFactory.create())
            .build()
            .create(UserApiService::class.java)
    }
}
