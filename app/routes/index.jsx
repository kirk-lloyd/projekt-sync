import { useLoaderData } from "@remix-run/react";
import { json } from "@remix-run/node";

export let loader = async ({ request }) => {
  let metafieldStatus = request.metafieldStatus || 'unknown';
  return json({ metafieldStatus });
};

export default function Index() {
  let { metafieldStatus } = useLoaderData();

  return (
    <div>
      <h1>Metafield Status: {metafieldStatus === 'done' ? 'Metafields done' : 'Metafields error'}</h1>
    </div>
  );
}
