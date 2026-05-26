package edu.cit.castillo.searchnsnip.barbershop

import android.app.DatePickerDialog
import android.os.Bundle
import android.util.Log
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.Button
import android.widget.CheckBox
import android.widget.TextView
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import edu.cit.castillo.searchnsnip.R
import edu.cit.castillo.searchnsnip.network.SessionManager
import edu.cit.castillo.searchnsnip.network.ApiClient
import edu.cit.castillo.searchnsnip.network.BookingSummary
import edu.cit.castillo.searchnsnip.network.CreateBookingRequest
import edu.cit.castillo.searchnsnip.network.ServiceSummary
import retrofit2.Call
import retrofit2.Callback
import retrofit2.Response
import java.text.SimpleDateFormat
import java.util.Calendar
import java.util.Locale

class BookingActivity : AppCompatActivity() {

    private lateinit var textShopName: TextView
    private lateinit var btnSelectDate: Button
    private lateinit var btnConfirmBooking: Button
    private lateinit var recyclerViewServices: RecyclerView
    private lateinit var sessionManager: SessionManager

    private var shopId: Long = -1
    private var shopName: String = ""
    private var selectedDate: Calendar? = null
    private val selectedServiceIds = mutableSetOf<Long>()
    private var servicesList = listOf<ServiceSummary>()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_booking)
        supportActionBar?.title = "Book an Appointment"
        supportActionBar?.setDisplayHomeAsUpEnabled(true)

        sessionManager = SessionManager(this)
        
        shopId = intent.getLongExtra("SHOP_ID", -1)
        shopName = intent.getStringExtra("SHOP_NAME") ?: "Barbershop"

        textShopName = findViewById(R.id.textShopName)
        btnSelectDate = findViewById(R.id.btnSelectDate)
        btnConfirmBooking = findViewById(R.id.btnConfirmBooking)
        recyclerViewServices = findViewById(R.id.recyclerViewServices)

        textShopName.text = shopName
        recyclerViewServices.layoutManager = LinearLayoutManager(this)

        btnSelectDate.setOnClickListener {
            showDatePicker()
        }

        btnConfirmBooking.setOnClickListener {
            submitBooking()
        }

        fetchServices()
    }

    override fun onSupportNavigateUp(): Boolean {
        finish()
        return true
    }

    private fun showDatePicker() {
        val calendar = Calendar.getInstance()
        DatePickerDialog(
            this,
            { _, year, month, dayOfMonth ->
                val selected = Calendar.getInstance()
                selected.set(year, month, dayOfMonth)
                selectedDate = selected
                
                val sdf = SimpleDateFormat("yyyy-MM-dd", Locale.getDefault())
                btnSelectDate.text = sdf.format(selected.time)
            },
            calendar.get(Calendar.YEAR),
            calendar.get(Calendar.MONTH),
            calendar.get(Calendar.DAY_OF_MONTH)
        ).apply {
            datePicker.minDate = System.currentTimeMillis() - 1000
            show()
        }
    }

    private fun fetchServices() {
        if (shopId == -1L) return

        val token = sessionManager.getAuthToken() ?: return
        ApiClient.userApiService.getBarbershopServices("Bearer $token", shopId)
            .enqueue(object : Callback<List<ServiceSummary>> {
                override fun onResponse(
                    call: Call<List<ServiceSummary>>,
                    response: Response<List<ServiceSummary>>
                ) {
                    if (response.isSuccessful) {
                        servicesList = response.body() ?: emptyList()
                        setupServicesAdapter()
                    } else {
                        Toast.makeText(this@BookingActivity, "Failed to load services", Toast.LENGTH_SHORT).show()
                    }
                }

                override fun onFailure(call: Call<List<ServiceSummary>>, t: Throwable) {
                    Toast.makeText(this@BookingActivity, "Error loading services", Toast.LENGTH_SHORT).show()
                }
            })
    }

    private fun setupServicesAdapter() {
        recyclerViewServices.adapter = object : RecyclerView.Adapter<ServiceViewHolder>() {
            override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): ServiceViewHolder {
                val view = LayoutInflater.from(parent.context)
                    .inflate(R.layout.item_service_booking, parent, false)
                return ServiceViewHolder(view)
            }

            override fun onBindViewHolder(holder: ServiceViewHolder, position: Int) {
                val service = servicesList[position]
                holder.bind(service)
            }

            override fun getItemCount() = servicesList.size
        }
    }

    inner class ServiceViewHolder(itemView: View) : RecyclerView.ViewHolder(itemView) {
        private val checkbox: CheckBox = itemView.findViewById(R.id.checkboxService)
        private val textName: TextView = itemView.findViewById(R.id.textServiceName)
        private val textDuration: TextView = itemView.findViewById(R.id.textServiceDuration)
        private val textPrice: TextView = itemView.findViewById(R.id.textServicePrice)

        fun bind(service: ServiceSummary) {
            textName.text = service.name
            textDuration.text = service.duration
            textPrice.text = "$${service.price}"
            
            checkbox.setOnCheckedChangeListener(null)
            checkbox.isChecked = selectedServiceIds.contains(service.serviceId)
            
            checkbox.setOnCheckedChangeListener { _, isChecked ->
                if (isChecked) {
                    selectedServiceIds.add(service.serviceId)
                } else {
                    selectedServiceIds.remove(service.serviceId)
                }
            }
            
            itemView.setOnClickListener {
                checkbox.isChecked = !checkbox.isChecked
            }
        }
    }

    private fun submitBooking() {
        if (selectedServiceIds.isEmpty()) {
            Toast.makeText(this, "Please select at least one service", Toast.LENGTH_SHORT).show()
            return
        }

        if (selectedDate == null) {
            Toast.makeText(this, "Please select a date", Toast.LENGTH_SHORT).show()
            return
        }

        val token = sessionManager.getAuthToken()
        if (token == null) {
            Toast.makeText(this, "You must be logged in", Toast.LENGTH_SHORT).show()
            return
        }

        val sdf = SimpleDateFormat("yyyy-MM-dd", Locale.getDefault())
        val dateString = sdf.format(selectedDate!!.time)

        val request = CreateBookingRequest(
            shopId = shopId,
            serviceIds = selectedServiceIds.toList(),
            appointmentDate = dateString
        )

        btnConfirmBooking.isEnabled = false
        btnConfirmBooking.text = "Booking..."

        ApiClient.userApiService.createBooking("Bearer $token", request)
            .enqueue(object : Callback<BookingSummary> {
                override fun onResponse(
                    call: Call<BookingSummary>,
                    response: Response<BookingSummary>
                ) {
                    btnConfirmBooking.isEnabled = true
                    btnConfirmBooking.text = "Confirm Booking"

                    if (response.isSuccessful) {
                        Toast.makeText(this@BookingActivity, "Booking successful!", Toast.LENGTH_LONG).show()
                        finish()
                    } else {
                        Log.e("BookingActivity", "Failed: ${response.errorBody()?.string()}")
                        Toast.makeText(this@BookingActivity, "Failed to book", Toast.LENGTH_SHORT).show()
                    }
                }

                override fun onFailure(call: Call<BookingSummary>, t: Throwable) {
                    btnConfirmBooking.isEnabled = true
                    btnConfirmBooking.text = "Confirm Booking"
                    Toast.makeText(this@BookingActivity, "Error booking appointment", Toast.LENGTH_SHORT).show()
                }
            })
    }
}
