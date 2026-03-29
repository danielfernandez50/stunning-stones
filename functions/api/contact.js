export async function onRequestPost(context) {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };

  try {
    const { name, email, phone, service, message } = await context.request.json();

    if (!name || !email) {
      return new Response(
        JSON.stringify({ error: "Name and email are required." }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const RESEND_API_KEY = context.env.RESEND_API_KEY;
    if (!RESEND_API_KEY) {
      return new Response(
        JSON.stringify({ error: "Email service not configured." }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1a1a1a; border-bottom: 2px solid #b8965a; padding-bottom: 12px;">
          New Estimate Request
        </h2>
        <table style="width: 100%; border-collapse: collapse; margin-top: 16px;">
          <tr>
            <td style="padding: 10px 0; font-weight: bold; color: #555; width: 120px;">Name:</td>
            <td style="padding: 10px 0; color: #1a1a1a;">${esc(name)}</td>
          </tr>
          <tr>
            <td style="padding: 10px 0; font-weight: bold; color: #555;">Email:</td>
            <td style="padding: 10px 0;"><a href="mailto:${esc(email)}" style="color: #b8965a;">${esc(email)}</a></td>
          </tr>
          ${phone ? `<tr>
            <td style="padding: 10px 0; font-weight: bold; color: #555;">Phone:</td>
            <td style="padding: 10px 0;"><a href="tel:${esc(phone)}" style="color: #b8965a;">${esc(phone)}</a></td>
          </tr>` : ""}
          ${service ? `<tr>
            <td style="padding: 10px 0; font-weight: bold; color: #555;">Service:</td>
            <td style="padding: 10px 0; color: #1a1a1a;">${esc(service)}</td>
          </tr>` : ""}
        </table>
        ${message ? `
          <div style="margin-top: 20px; padding: 16px; background: #f9f9f7; border-left: 3px solid #b8965a; border-radius: 4px;">
            <p style="margin: 0 0 8px; font-weight: bold; color: #555;">Project Details:</p>
            <p style="margin: 0; color: #1a1a1a; white-space: pre-wrap;">${esc(message)}</p>
          </div>
        ` : ""}
        <p style="margin-top: 24px; font-size: 12px; color: #999;">Sent from stunning-stones.net</p>
      </div>
    `;

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Stunning Stones Website <noreply@stunning-stones.net>",
        to: ["info@stunning-stones.net"],
        reply_to: email,
        subject: `New Estimate Request from ${name}`,
        html: emailHtml,
      }),
    });

    if (!res.ok) {
      console.error("Resend error:", await res.text());
      return new Response(
        JSON.stringify({ error: "Failed to send. Please try again." }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (err) {
    console.error("Contact error:", err);
    return new Response(
      JSON.stringify({ error: "Something went wrong. Please try again." }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
}

export async function onRequestOptions() {
  return new Response(null, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}

function esc(s) {
  if (!s) return "";
  return s.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#039;");
}
