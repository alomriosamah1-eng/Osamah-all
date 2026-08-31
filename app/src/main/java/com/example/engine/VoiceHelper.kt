package com.example.engine

import android.content.Context
import android.content.Intent
import android.os.Bundle
import android.speech.RecognitionListener
import android.speech.RecognizerIntent
import android.speech.SpeechRecognizer
import android.speech.tts.TextToSpeech
import android.speech.tts.UtteranceProgressListener
import android.util.Log
import java.util.Locale

class VoiceHelper(
    private val context: Context,
    private val onStateChange: (isSpeaking: Boolean) -> Unit
) : TextToSpeech.OnInitListener {

    private var tts: TextToSpeech? = null
    private var isTtsInitialized = false
    private var speechRecognizer: SpeechRecognizer? = null

    init {
        tts = TextToSpeech(context.applicationContext, this)
    }

    override fun onInit(status: Int) {
        if (status == TextToSpeech.SUCCESS) {
            isTtsInitialized = true
            // Arabic locale support
            val arabicLocale = Locale("ar", "SY") // Syrian Arabic locale
            val result = tts?.setLanguage(arabicLocale)
            if (result == TextToSpeech.LANG_MISSING_DATA || result == TextToSpeech.LANG_NOT_SUPPORTED) {
                tts?.setLanguage(Locale("ar"))
            }

            tts?.setOnUtteranceProgressListener(object : UtteranceProgressListener() {
                override fun onStart(utteranceId: String?) {
                    onStateChange(true)
                }

                override fun onDone(utteranceId: String?) {
                    onStateChange(false)
                }

                override fun onError(utteranceId: String?) {
                    onStateChange(false)
                }
            })
        }
    }

    fun speak(text: String, isFemale: Boolean = false, speed: Float = 1.0f, pitch: Float = 1.0f) {
        if (!isTtsInitialized || tts == null) return

        // Male vs Female voice acoustic characteristics
        val actualPitch = if (isFemale) pitch * 1.35f else pitch * 0.88f
        tts?.setPitch(actualPitch)
        tts?.setSpeechRate(speed.coerceIn(0.5f, 2.0f))

        val cleanText = text.replace("[*#_`]", "")
        val params = Bundle()
        tts?.speak(cleanText, TextToSpeech.QUEUE_FLUSH, params, "OsamahUtterance_${System.currentTimeMillis()}")
    }

    fun stopSpeaking() {
        tts?.stop()
        onStateChange(false)
    }

    fun startListening(onResult: (String) -> Unit, onError: (String) -> Unit) {
        if (!SpeechRecognizer.isRecognitionAvailable(context)) {
            onError("التعرف على الصوت غير مدعوم على هذا الجهاز")
            return
        }

        stopSpeaking() // Interrupt on speech start

        try {
            speechRecognizer?.destroy()
            speechRecognizer = SpeechRecognizer.createSpeechRecognizer(context).apply {
                setRecognitionListener(object : RecognitionListener {
                    override fun onReadyForSpeech(params: Bundle?) {}
                    override fun onBeginningOfSpeech() {}
                    override fun onRmsChanged(rmsdB: Float) {}
                    override fun onBufferReceived(buffer: ByteArray?) {}
                    override fun onEndOfSpeech() {}

                    override fun onError(error: Int) {
                        onError("رمز خطأ الصوت: $error")
                    }

                    override fun onResults(results: Bundle?) {
                        val matches = results?.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION)
                        if (!matches.isNullOrEmpty()) {
                            onResult(matches[0])
                        }
                    }

                    override fun onPartialResults(partialResults: Bundle?) {}
                    override fun onEvent(eventType: Int, params: Bundle?) {}
                })
            }

            val intent = Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH).apply {
                putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM)
                putExtra(RecognizerIntent.EXTRA_LANGUAGE, "ar-SY")
                putExtra(RecognizerIntent.EXTRA_PROMPT, "تحدث لوكيل أسامة...")
            }
            speechRecognizer?.startListening(intent)
        } catch (e: Exception) {
            onError("تعذر بدء الاستماع: ${e.message}")
        }
    }

    fun stopListening() {
        try {
            speechRecognizer?.stopListening()
        } catch (e: Exception) {
            Log.e("VoiceHelper", "Error stopping recognizer: ${e.message}")
        }
    }

    fun release() {
        tts?.stop()
        tts?.shutdown()
        speechRecognizer?.destroy()
    }
}
