import { useEffect } from "react";
import { useFetcher } from "@remix-run/react";
import { authenticate } from "../../shopify.server";

// Loader function to authenticate admin before rendering the page
export const loader = async ({ request }) => {
  console.log("Loader function executed"); // Log statement to verify execution
  await authenticate.admin(request); // Authenticate admin user
  await action({ request }); // Call the action function

  return null; // Return null as no data needs to be passed to the component
};

// Helper function to fetch GraphQL data and handle errors
const fetchGraphQL = async (admin, query, variables) => {
  const response = await admin.graphql(query, variables);

  // Parse the response body as JSON
  const jsonResponse = await response.json();
  if (!response.ok || jsonResponse.errors) {
    console.error("GraphQL API returned errors:", jsonResponse.errors || response.statusText);
    throw new Error("Failed to fetch GraphQL data");
  }
  return jsonResponse;
};

// Action function to handle form submissions or other actions
export const action = async ({ request }) => {
  const { admin } = await authenticate.admin(request); // Authenticate admin user

  // Define the required Metafields
  const requiredMetafields = [
    {
      namespace: "projekt-stock-sync-children",
      key: "childrenkey",
      name: "Projekt Sync - Product Children",
      description: "This defines which children stock should be updated by the product master. This will only be used If this product is set to Projekt Sync - Product Master 'True'",
      type: "list.variant_reference",
      ownerType: "PRODUCT",
    },
    {
      namespace: "projekt-stock-sync-master",
      key: "masterkey",
      name: "Projekt Sync - Product Master",
      description: "Set to true if this product is the stock sync master for inventory management. Please note a stock master can not be a stock child.",
      type: "boolean",
      ownerType: "PRODUCT",
    },
  ];

  for (const metafield of requiredMetafields) {
    try {
      // Query for existing metafield definitions
      const existingDefinitions = await fetchGraphQL(
        admin,
        `#graphql
          query GetMetafieldDefinitions($namespace: String!, $ownerType: MetafieldOwnerType!) {
            metafieldDefinitions(first: 100, namespace: $namespace, ownerType: $ownerType) {
              edges {
                node {
                  key
                }
              }
            }
          }
        `,
        {
          variables: {
            namespace: metafield.namespace,
            ownerType: metafield.ownerType,
          },
        }
      );

      // Log the response for debugging
      console.log("Existing metafield definitions response:", existingDefinitions);

      // Process the response
      const existingKeys = existingDefinitions.data.metafieldDefinitions.edges.map(edge => edge.node.key);

      if (!existingKeys.includes(metafield.key)) {
        // Create the metafield definition if it doesn't exist
        const response = await fetchGraphQL(
          admin,
          `#graphql
            mutation CreateMetafieldDefinition($definition: MetafieldDefinitionInput!) {
              metafieldDefinitionCreate(definition: $definition) {
                createdDefinition {
                  id
                  name
                }
                userErrors {
                  field
                  message
                  code
                }
              }
            }
          `,
          {
            variables: {
              definition: metafield,
            },
          }
        );

        // Log the creation response
        console.log("Create metafield response:", response);

        // Handle user errors
        if (response.data.metafieldDefinitionCreate.userErrors.length > 0) {
          console.error("User errors:", response.data.metafieldDefinitionCreate.userErrors);
        } else {
          console.log("Metafield created:", response.data.metafieldDefinitionCreate.createdDefinition);
        }
      } else {
        console.log(`Metafield "${metafield.key}" already exists.`);
      }
    } catch (error) {
      console.error("Error checking or creating metafield:", error);
    }
  }

  return null; // Return null as no data needs to be passed to the component
};
