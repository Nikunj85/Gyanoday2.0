import { NextResponse } from 'next/server'
import OpenAI from 'openai'
import * as pdfParse from 'pdf-parse'
import { createClient } from '@supabase/supabase-js'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

// Initialize Supabase Admin/Service Client to update chapters
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function POST(req: Request) {
  try {
    const { chapterId, pdfUrl } = await req.json()

    if (!chapterId || !pdfUrl) {
      return NextResponse.json(
        { error: 'Chapter ID and PDF URL are required.' },
        { status: 400 }
      )
    }

    // 1. Fetch PDF buffer from storage
    const pdfResponse = await fetch(pdfUrl)
    if (!pdfResponse.ok) {
      throw new Error('Failed to download chapter PDF.')
    }
    const arrayBuffer = await pdfResponse.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // 2. Parse PDF text
   const pdfData = await (pdfParse as any)(buffer)
    
    // Truncate long text if necessary to fit token limits
    const extractedText = pdfData.text.slice(0, 12000) 

    // 3. Request OpenAI structured JSON output
    const aiResponse = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: `You are an expert academic AI tutor. Analyze the provided chapter text and generate high-yield active-recall smart notes. 
Return a JSON object with a single key "notes" containing an array of 5 to 8 key concepts.
Each concept object must have:
- "concept": Short title of the topic/concept.
- "keyTakeaway": A concise, clear summary of the concept.
- "activeRecallQuestion": A prompt or question that tests student memory/understanding.
- "hiddenAnswer": A precise, complete answer to the question.`,
        },
        {
          role: 'user',
          content: `Chapter Content:\n${extractedText}`,
        },
      ],
      temperature: 0.3,
    })

    const rawContent = aiResponse.choices[0]?.message?.content || '{}'
    const parsedData = JSON.parse(rawContent)
    const generatedNotes = parsedData.notes || []

    // 4. Save to Database so future loads are instant
    const { error: dbError } = await supabase
      .from('chapters')
      .update({ smart_notes: generatedNotes })
      .eq('id', chapterId)

    if (dbError) {
      console.error('Database update error:', dbError)
    }

    return NextResponse.json({ notes: generatedNotes })
  } catch (error: any) {
    console.error('Error generating smart notes:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to generate smart notes.' },
      { status: 500 }
    )
  }
}