// app/routes/webhooks/app_uninstalled.jsx
import { json } from "@remix-run/node";
import shopify from "~/projekt-sync/app/shopify.server";

export const action = async ({ request }) => {
    try {
        const shop = request.headers.get("x-shopify-shop-domain");

        console.log("Received APP_UNINSTALLED webhook for shop:", shop);

        // Validate and delete session from Prisma database
        await shopify.sessionStorage.deleteSession(shop);
        console.log(`Deleted session for shop: ${shop}`);
        
        return json({ success: true });
    } catch (error) {
        console.error("Error handling APP_UNINSTALLED webhook:", error.message);
        return json({ error: error.message }, { status: 500 });
    }
};
