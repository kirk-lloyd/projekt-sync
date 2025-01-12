import { json } from "@remix-run/node";
import { useLoaderData, Link, useNavigate } from "@remix-run/react";
import { authenticate } from "../shopify.server";
import {
  Card,
  EmptyState,
  Layout,
  Page,
  IndexTable,
  Thumbnail,
} from "@shopify/polaris";

// Loader function to authenticate and fetch products with a specific metafield
export const loader = async ({ request }) => {
  const { admin } = await authenticate.admin(request);

  try {
    // Fetch products that match the metafield criteria using Shopify's GraphQL API
    const response = await admin.graphql(
      `#graphql
        query GetProductsWithMetafield($query: String!) {
          products(first: 100, query: $query) {
            edges {
              node {
                id
                title
                createdAt
                images(first: 1) {
                  edges {
                    node {
                      originalSrc
                    }
                  }
                }
                metafields(first: 1, namespace: "projekt-stock-sync-master") {
                  edges {
                    node {
                      key
                      value
                    }
                  }
                }
              }
            }
          }
        }
      `,
      {
        variables: {
          query: "metafields.namespace:'projekt-stock-sync-master' metafields.key:'masterkey' metafields.value:'true'",
        },
      }
    );

    const data = await response.json();

    // Validate the response structure
    if (!data?.data?.products) {
      throw new Error("Invalid GraphQL response structure");
    }

    // Extract products and return them
    const products = data.data.products.edges.map(edge => edge.node);
    return json({ products });
  } catch (error) {
    console.error("Error fetching products:", error);
    return json({ error: error.message }, { status: 500 });
  }
};

// Component to display an empty state when no products are found
const EmptyProductState = ({ onAction }) => (
  <EmptyState
    heading="No products found"
    action={{
      content: "Add Product",
      onAction,
    }}
    image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
  >
    <p>Add products to your store to see them here.</p>
  </EmptyState>
);

// Utility function to truncate long strings for display purposes
function truncate(str, { length = 25 } = {}) {
  if (!str) return "";
  if (str.length <= length) return str;
  return str.slice(0, length) + "…";
}

// Component to render the table of products
const MasterProducts = ({ products }) => (
  <IndexTable
    resourceName={{
      singular: "Product",
      plural: "Products",
    }}
    itemCount={products.length}
    headings={[
      { title: "Thumbnail", hidden: true },
      { title: "Title" },
      { title: "Date created" },
    ]}
    selectable={false}
  >
    {products.map((product) => (
      <ProductTableRow key={product.id} product={product} />
    ))}
  </IndexTable>
);

// Component to render each row of the product table
const ProductTableRow = ({ product }) => (
  <IndexTable.Row id={product.id} position={product.id}>
    <IndexTable.Cell>
      <Thumbnail
        source={product.images.edges[0]?.node.originalSrc || ""}
        alt={product.title}
        size="small"
      />
    </IndexTable.Cell>
    <IndexTable.Cell>
      <Link to={`products/${product.id}`}>{truncate(product.title)}</Link>
    </IndexTable.Cell>
    <IndexTable.Cell>
      {new Date(product.createdAt).toDateString()}
    </IndexTable.Cell>
  </IndexTable.Row>
);

// Main component to render the page
export default function Index() {
  const { products = [] } = useLoaderData();
  const navigate = useNavigate();

  return (
    <Page>
      <div>
        <h1>Master Products</h1>
      </div>
      <Layout>
        <Layout.Section>
          <Card padding="0">
            {products.length === 0 ? (
              <EmptyProductState onAction={() => navigate("/app/products/new")} />
            ) : (
              <MasterProducts products={products} />
            )}
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
