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
- Give specific, actionable advice based on their actual data
- Be concise but thorough — no fluff
- Use their real numbers when referencing their progress
- If they ask about exercises, programming, nutrition, or recovery, answer with expertise
- Keep responses focused and practical
- Format responses cleanly, use bullet points when listing multiple things`
    }
  })

  return NextResponse.json({ message: response.text })
}