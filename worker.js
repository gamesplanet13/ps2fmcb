export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin") || "";

    const allowedOrigins = new Set([
      "https://gamesplanet13.github.io",
      "https://arcade-accessories.pages.dev"
    ]);

    const allowedOrigin = allowedOrigins.has(origin)
      ? origin
      : "https://gamesplanet13.github.io";

    const corsHeaders = {
      "Access-Control-Allow-Origin": allowedOrigin,
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Vary": "Origin"
    };

    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: corsHeaders
      });
    }

    if (request.method !== "POST") {
      return jsonResponse(
        { error: "Only POST requests are allowed" },
        405,
        corsHeaders
      );
    }

    if (!allowedOrigins.has(origin)) {
      return jsonResponse(
        { error: "This website is not allowed" },
        403,
        corsHeaders
      );
    }

    if (!env.OPENAI_API_KEY) {
      return jsonResponse(
        { error: "OPENAI_API_KEY secret is missing" },
        500,
        corsHeaders
      );
    }

    try {
      const body = await request.json();
      const prompt = String(body.prompt || "").trim();

      if (!prompt) {
        return jsonResponse(
          { error: "Image prompt is missing" },
          400,
          corsHeaders
        );
      }

      if (prompt.length > 8000) {
        return jsonResponse(
          { error: "Prompt is too long" },
          400,
          corsHeaders
        );
      }

      const openAIResponse = await fetch(
        "https://api.openai.com/v1/images/generations",
        {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${env.OPENAI_API_KEY}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            model: "gpt-image-1",
            prompt,
            size: "1536x1024",
            quality: "medium",
            output_format: "png"
          })
        }
      );

      const data = await openAIResponse.json();

      if (!openAIResponse.ok) {
        return jsonResponse(
          {
            error: data?.error?.message || "OpenAI image generation failed"
          },
          openAIResponse.status,
          corsHeaders
        );
      }

      const imageBase64 = data?.data?.[0]?.b64_json;

      if (!imageBase64) {
        return jsonResponse(
          { error: "OpenAI did not return image data" },
          500,
          corsHeaders
        );
      }

      return jsonResponse(
        { imageUrl: `data:image/png;base64,${imageBase64}` },
        200,
        corsHeaders
      );

    } catch (error) {
      return jsonResponse(
        { error: error?.message || "Worker server error" },
        500,
        corsHeaders
      );
    }
  }
};

function jsonResponse(data, status, corsHeaders) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
      "Cache-Control": "no-store"
    }
  });
}
