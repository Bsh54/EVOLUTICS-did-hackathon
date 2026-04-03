package com.polyversitywallet

import android.content.Intent
import android.os.Bundle
import androidx.appcompat.app.AppCompatActivity

class SplashActivity : AppCompatActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        // Start MainActivity immediately and forward the intent (including deep link data)
        val intent = Intent(this, MainActivity::class.java)
        intent.putExtras(this.intent)
        intent.data = this.intent.data
        intent.action = this.intent.action
        
        startActivity(intent)
        finish()
    }
}
