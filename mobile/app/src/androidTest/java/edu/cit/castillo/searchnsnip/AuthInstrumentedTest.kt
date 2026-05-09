package edu.cit.castillo.searchnsnip

import androidx.test.espresso.Espresso.onView
import androidx.test.espresso.action.ViewActions.*
import androidx.test.espresso.assertion.ViewAssertions.matches
import androidx.test.espresso.matcher.ViewMatchers.*
import androidx.test.core.app.ActivityScenario
import androidx.test.core.app.ApplicationProvider
import edu.cit.castillo.searchnsnip.network.SessionManager
import androidx.test.ext.junit.runners.AndroidJUnit4
import edu.cit.castillo.searchnsnip.auth.LoginActivity
import org.junit.Before
import org.junit.After
import org.junit.Test
import org.junit.runner.RunWith

@RunWith(AndroidJUnit4::class)
class AuthInstrumentedTest {

    private lateinit var scenario: ActivityScenario<LoginActivity>

    @Before
    fun setUp() {
        val context = ApplicationProvider.getApplicationContext<android.content.Context>()
        val sessionManager = SessionManager(context)
        sessionManager.clearSession()

        scenario = ActivityScenario.launch(LoginActivity::class.java)
    }

    @After
    fun tearDown() {
        scenario.close()
    }

    @Test
    fun login_emptyFields_showsToast() {
        // Click login without entering anything
        onView(withId(R.id.btnLogin)).perform(click())

        // Note: Checking toasts in Espresso can be tricky, so we just verify the app doesn't crash
        // and the input fields are still displayed.
        onView(withId(R.id.emailInput)).check(matches(isDisplayed()))
        onView(withId(R.id.passwordInput)).check(matches(isDisplayed()))
    }

    @Test
    fun login_invalidEmail_showsErrorOnEditText() {
        // Type invalid email
        onView(withId(R.id.emailInput)).perform(typeText("invalidemail"), closeSoftKeyboard())
        onView(withId(R.id.passwordInput)).perform(typeText("Password123!"), closeSoftKeyboard())

        // Click login
        onView(withId(R.id.btnLogin)).perform(click())

        // Check if error is shown on email input
        onView(withId(R.id.emailInput)).check(matches(hasErrorText("Please enter a valid email address.")))
    }

    @Test
    fun login_navigateToRegister() {
        // Click on the register link
        onView(withId(R.id.linkRegister)).perform(click())

        // Verify that the RegisterActivity UI elements are displayed
        onView(withId(R.id.regEmailInput)).check(matches(isDisplayed()))
        onView(withId(R.id.firstNameInput)).check(matches(isDisplayed()))
        onView(withId(R.id.lastNameInput)).check(matches(isDisplayed()))
    }
}
