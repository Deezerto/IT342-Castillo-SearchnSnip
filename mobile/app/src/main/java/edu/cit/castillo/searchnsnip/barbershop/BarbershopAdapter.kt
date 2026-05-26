package edu.cit.castillo.searchnsnip.barbershop

import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.ImageView
import android.widget.TextView
import androidx.recyclerview.widget.RecyclerView
import edu.cit.castillo.searchnsnip.R
import edu.cit.castillo.searchnsnip.network.BarbershopSummary

class BarbershopAdapter(
    private var barbershops: List<BarbershopSummary>,
    private val onItemClick: (BarbershopSummary) -> Unit
) : RecyclerView.Adapter<BarbershopAdapter.BarbershopViewHolder>() {

    inner class BarbershopViewHolder(itemView: View) : RecyclerView.ViewHolder(itemView) {
        val imgBarbershop: ImageView = itemView.findViewById(R.id.imgBarbershop)
        val textName: TextView = itemView.findViewById(R.id.textBarbershopName)
        val textAddress: TextView = itemView.findViewById(R.id.textBarbershopAddress)
        val textRating: TextView = itemView.findViewById(R.id.textBarbershopRating)
        val textStatus: TextView = itemView.findViewById(R.id.textBarbershopStatus)

        fun bind(barbershop: BarbershopSummary) {
            textName.text = barbershop.name
            textAddress.text = barbershop.address
            
            // Just placeholder for rating since it's not in BarbershopSummary yet
            textRating.text = "★ 4.5 (10+ reviews)"

            // Simply use placeholder
            imgBarbershop.setBackgroundResource(R.drawable.bg_dashboard_thumbnail)

            itemView.setOnClickListener {
                onItemClick(barbershop)
            }
        }
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): BarbershopViewHolder {
        val view = LayoutInflater.from(parent.context)
            .inflate(R.layout.item_barbershop_dashboard, parent, false)
        return BarbershopViewHolder(view)
    }

    override fun onBindViewHolder(holder: BarbershopViewHolder, position: Int) {
        holder.bind(barbershops[position])
    }

    override fun getItemCount(): Int = barbershops.size

    fun updateData(newBarbershops: List<BarbershopSummary>) {
        barbershops = newBarbershops
        notifyDataSetChanged()
    }
}
