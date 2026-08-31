package com.example.engine

import android.content.Context
import android.graphics.Color
import android.graphics.Paint
import android.graphics.Typeface
import android.graphics.pdf.PdfDocument
import java.io.File
import java.io.FileOutputStream

object PdfEngine {

    data class PdfReportData(
        val title: String,
        val subtitle: String,
        val author: String,
        val sections: List<PdfSection>,
        val isBookMode: Boolean = false
    )

    data class PdfSection(
        val heading: String,
        val body: String,
        val bulletPoints: List<String> = emptyList()
    )

    fun createPdfDocument(context: Context, data: PdfReportData): File {
        val pdfDocument = PdfDocument()
        val paint = Paint().apply { isAntiAlias = true }
        val pageWidth = 595
        val pageHeight = 842

        // Determine pages needed
        var pageNumber = 1
        var currentSectionIndex = 0

        while (currentSectionIndex < data.sections.size || pageNumber == 1) {
            val pageInfo = PdfDocument.PageInfo.Builder(pageWidth, pageHeight, pageNumber).create()
            val page = pdfDocument.startPage(pageInfo)
            val canvas = page.canvas

            if (pageNumber == 1) {
                // Cover / Header Page
                paint.color = Color.parseColor("#0B132B") // Deep Navy
                canvas.drawRect(0f, 0f, pageWidth.toFloat(), 150f, paint)

                paint.color = Color.parseColor("#00F0FF") // Cyan Neon
                paint.textSize = if (data.isBookMode) 22f else 19f
                paint.typeface = Typeface.create(Typeface.DEFAULT, Typeface.BOLD)
                canvas.drawText(data.title.take(45), 40f, 60f, paint)

                paint.color = Color.parseColor("#E2E8F0")
                paint.textSize = 12f
                paint.typeface = Typeface.DEFAULT
                canvas.drawText(data.subtitle.take(65), 40f, 90f, paint)

                paint.color = Color.parseColor("#38BDF8")
                paint.textSize = 10f
                canvas.drawText("الجهة المصممة: ${data.author} • وكيل أسامة", 40f, 120f, paint)

                var currentY = 185f
                paint.color = Color.parseColor("#FFFFFF")
                canvas.drawRect(0f, 150f, pageWidth.toFloat(), pageHeight.toFloat(), paint)

                while (currentSectionIndex < data.sections.size) {
                    val section = data.sections[currentSectionIndex]

                    // Heading
                    paint.color = Color.parseColor("#1E3A8A")
                    paint.textSize = 14f
                    paint.typeface = Typeface.create(Typeface.DEFAULT, Typeface.BOLD)
                    canvas.drawText(section.heading, 40f, currentY, paint)
                    currentY += 22f

                    // Body
                    paint.color = Color.parseColor("#334155")
                    paint.textSize = 11f
                    paint.typeface = Typeface.DEFAULT

                    val lines = wrapText(section.body, 65)
                    var fits = true
                    for (line in lines) {
                        if (currentY > 770f) {
                            fits = false
                            break
                        }
                        canvas.drawText(line, 45f, currentY, paint)
                        currentY += 16f
                    }

                    if (!fits) {
                        break
                    }

                    // Bullets
                    for (bullet in section.bulletPoints) {
                        if (currentY > 770f) {
                            fits = false
                            break
                        }
                        paint.color = Color.parseColor("#0284C7")
                        canvas.drawCircle(50f, currentY - 4f, 2.5f, paint)
                        paint.color = Color.parseColor("#1E293B")
                        canvas.drawText(bullet, 60f, currentY, paint)
                        currentY += 16f
                    }

                    if (!fits) {
                        break
                    }

                    currentY += 18f
                    currentSectionIndex++

                    if (currentY > 750f) {
                        break
                    }
                }

                // Page Footer
                paint.color = Color.parseColor("#94A3B8")
                paint.textSize = 9f
                canvas.drawText("صفحة $pageNumber • تصميم وتوثيق وكيل أسامة", 200f, 820f, paint)
                pdfDocument.finishPage(page)
                pageNumber++

                if (currentSectionIndex >= data.sections.size) {
                    break
                }
            } else {
                // Secondary / Multi-page Book Sections
                paint.color = Color.parseColor("#FFFFFF")
                canvas.drawRect(0f, 0f, pageWidth.toFloat(), pageHeight.toFloat(), paint)

                paint.color = Color.parseColor("#F1F5F9")
                canvas.drawRect(0f, 0f, pageWidth.toFloat(), 50f, paint)

                paint.color = Color.parseColor("#475569")
                paint.textSize = 10f
                canvas.drawText("${data.title} — إعداد وكيل أسامة", 40f, 30f, paint)

                var currentY = 85f

                while (currentSectionIndex < data.sections.size) {
                    val section = data.sections[currentSectionIndex]

                    paint.color = Color.parseColor("#1E3A8A")
                    paint.textSize = 14f
                    paint.typeface = Typeface.create(Typeface.DEFAULT, Typeface.BOLD)
                    canvas.drawText(section.heading, 40f, currentY, paint)
                    currentY += 22f

                    paint.color = Color.parseColor("#334155")
                    paint.textSize = 11f
                    paint.typeface = Typeface.DEFAULT

                    val lines = wrapText(section.body, 65)
                    var fits = true
                    for (line in lines) {
                        if (currentY > 770f) {
                            fits = false
                            break
                        }
                        canvas.drawText(line, 45f, currentY, paint)
                        currentY += 16f
                    }

                    if (!fits) break

                    for (bullet in section.bulletPoints) {
                        if (currentY > 770f) {
                            fits = false
                            break
                        }
                        paint.color = Color.parseColor("#0284C7")
                        canvas.drawCircle(50f, currentY - 4f, 2.5f, paint)
                        paint.color = Color.parseColor("#1E293B")
                        canvas.drawText(bullet, 60f, currentY, paint)
                        currentY += 16f
                    }

                    if (!fits) break

                    currentY += 18f
                    currentSectionIndex++

                    if (currentY > 740f) break
                }

                paint.color = Color.parseColor("#94A3B8")
                paint.textSize = 9f
                canvas.drawText("صفحة $pageNumber • نظام الكتب والتقارير الموثقة", 200f, 820f, paint)
                pdfDocument.finishPage(page)
                pageNumber++

                if (currentSectionIndex >= data.sections.size || pageNumber > 25) {
                    break
                }
            }
        }

        val outputDir = File(context.filesDir, "generated_documents").apply { mkdirs() }
        val sanitizedTitle = data.title.replace("\\s+".toRegex(), "_").take(25)
        val file = File(outputDir, "${sanitizedTitle}_${System.currentTimeMillis()}.pdf")
        FileOutputStream(file).use { out ->
            pdfDocument.writeTo(out)
        }
        pdfDocument.close()

        return file
    }

    private fun wrapText(text: String, maxCharsPerLine: Int): List<String> {
        val result = mutableListOf<String>()
        val words = text.split(" ")
        var currentLine = StringBuilder()

        for (word in words) {
            if (currentLine.length + word.length + 1 > maxCharsPerLine) {
                if (currentLine.isNotEmpty()) {
                    result.add(currentLine.toString())
                    currentLine = StringBuilder()
                }
            }
            if (currentLine.isNotEmpty()) currentLine.append(" ")
            currentLine.append(word)
        }
        if (currentLine.isNotEmpty()) {
            result.add(currentLine.toString())
        }
        return result
    }
}
