import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const systemDesignEngineUrl =
      process.env.NEXT_PUBLIC_SYSTEM_DESIGN_ENGINE_URL ||
      "http://localhost:3002";

    const response = await fetch(`${systemDesignEngineUrl}/generate-code`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("System Design Engine generate-code error:", errText);
      return NextResponse.json(
        { error: "Error from AI code generation service" },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error("API generate-code error:", error);
    return NextResponse.json(
      { error: error?.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
