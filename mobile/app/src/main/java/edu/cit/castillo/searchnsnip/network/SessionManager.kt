package edu.cit.castillo.searchnsnip.network

import android.content.Context

class SessionManager(context: Context) {
    private val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)

    fun saveAuthToken(token: String) {
        prefs.edit().putString(KEY_AUTH_TOKEN, token).apply()
    }

    fun getAuthToken(): String? {
        return prefs.getString(KEY_AUTH_TOKEN, null)
    }

    fun saveDisplayName(firstName: String, lastName: String) {
        val fullName = "$firstName $lastName".trim()
        prefs.edit().putString(KEY_DISPLAY_NAME, fullName).apply()
    }

    fun getDisplayName(): String? {
        return prefs.getString(KEY_DISPLAY_NAME, null)
    }

    fun clearSession() {
        prefs.edit().remove(KEY_AUTH_TOKEN).remove(KEY_DISPLAY_NAME).apply()
    }

    companion object {
        private const val PREFS_NAME = "searchnsnip_auth_prefs"
        private const val KEY_AUTH_TOKEN = "auth_token"
        private const val KEY_DISPLAY_NAME = "display_name"
    }
}
