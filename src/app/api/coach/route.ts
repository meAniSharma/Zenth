import { GoogleGenAI } from '@google/genai'
import { NextRequest, NextResponse } from 'next/server'

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! })

export async function POST(req: NextRequest) {
  const { messages, context } = await req.json()

  const lastMessage = messages[messages.length - 1].content

  const response = await ai.models.generateContent({
    model: 'gemini-3.5-flash',
    contents: `User question: ${lastMessage}\n\nTraining context:\n${context}`,
    config: {
      systemInstruction: `You are Zenth Coach, an elite AI personal trainer and strength coach built into the Zenth fitness platform. You are knowledgeable, motivating, and data-driven.

Guidelines:
- Never use asterisks, bullet symbols, or markdown formatting of any kind
- Write in plain conversational sentences like a human texting
- Be direct and confident, not robotic or overly enthusiastic
- No "Great question!" or "Certainly!" type openers — just answer
- Use numbers and the user's actual data when relevant
- Keep it concise — coaches don't write essays
- Occasional dry humour is fine
- If you don't know something, say so plainly`
    }
  })

  return NextResponse.json({ message: response.text })
}