import { GoogleGenerativeAI } from '@google/generative-ai'
import { NextRequest, NextResponse } from 'next/server'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

export async function POST(req: NextRequest) {
  const { messages, context } = await req.json()

  const model = genAI.getGenerativeModel({
    model: 'gemini-1.5-flash',
    systemInstruction: `You are Zenth Coach, an elite AI personal trainer and strength coach built into the Zenth fitness platform. You are knowledgeable, motivating, and data-driven.

You have access to the user's training data:
${context}

Guidelines:
- Give specific, actionable advice based on their actual data
- Be concise but thorough — no fluff
- Use their real numbers when referencing their progress
- If they ask about exercises, programming, nutrition, or recovery, answer with expertise
- Keep responses focused and practical
- Occasionally motivate but don't be cringe about it
- Format responses cleanly, use bullet points when listing multiple things`
  })

  const chat = model.startChat({
    history: messages.slice(0, -1).map((m: any) => ({
      role: m.role === 'user' ? 'user' : 'model',
      parts: [{ text: m.content }]
    }))
  })

  const lastMessage = messages[messages.length - 1].content
  const result = await chat.sendMessage(lastMessage)
  const text = result.response.text()

  return NextResponse.json({ message: text })
}