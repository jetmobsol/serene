import { getAuthTables } from "better-auth/db";
import type { BetterAuthOptions } from "better-auth/types";
import { createAuth } from "../../apps/api/lib/auth";
import { env } from "../../apps/api/lib/env";

/**
 * Generates the complete database structure from Better Auth configuration
 * Outputs the schema as formatted JSON showing all tables, fields, and relationships
 */
async function generateAuthSchema() {
  // Mock database instance - Better Auth only needs this for type checking, not actual queries
  const mockDb = {} as Record<string, unknown>;

  // Create the auth instance to get the configuration
  const auth = createAuth(mockDb, {
    ENVIRONMENT: env.ENVIRONMENT || "development",
    APP_NAME: env.APP_NAME || "Serene",
    APP_ORIGIN: env.APP_ORIGIN || "http://localhost:3000",
    BETTER_AUTH_SECRET:
      env.BETTER_AUTH_SECRET || "mock-secret-must-be-at-least-32-chars",
    GOOGLE_CLIENT_ID: env.GOOGLE_CLIENT_ID || "mock-client-id",
    GOOGLE_CLIENT_SECRET: env.GOOGLE_CLIENT_SECRET || "mock-client-secret",
    RESEND_API_KEY: env.RESEND_API_KEY || "mock-resend-key",
    RESEND_EMAIL_FROM: env.RESEND_EMAIL_FROM || "noreply@example.com",
    STRIPE_SECRET_KEY: env.STRIPE_SECRET_KEY,
    STRIPE_WEBHOOK_SECRET: env.STRIPE_WEBHOOK_SECRET,
    STRIPE_STARTER_PRICE_ID: env.STRIPE_STARTER_PRICE_ID,
    STRIPE_PRO_PRICE_ID: env.STRIPE_PRO_PRICE_ID,
    STRIPE_PRO_ANNUAL_PRICE_ID: env.STRIPE_PRO_ANNUAL_PRICE_ID,
  });

  // WARNING: Type assertion needed as Better Auth doesn't export the auth instance type
  const authOptions = (auth as { options: BetterAuthOptions }).options;

  // Get the complete database schema
  const tables = getAuthTables(authOptions);

  // Format the output for better readability
  const schemaOutput = {
    metadata: {
      description: "Better Auth database schema",
      generatedAt: new Date().toISOString(),
      tableCount: Object.keys(tables).length,
    },
    tables: {},
  };

  // Process each table
  for (const [tableKey, table] of Object.entries(tables)) {
    const processedFields: Record<string, Record<string, unknown>> = {};

    // Process each field in the table
    for (const [fieldKey, field] of Object.entries(table.fields)) {
      processedFields[fieldKey] = {
        type: field.type,
        required: field.required || false,
        unique: field.unique || false,
      };

      // Add references if they exist
      if (field.references) {
        processedFields[fieldKey].references = {
          model: field.references.model,
          field: field.references.field,
        };
      }
    }

    (schemaOutput.tables as Record<string, unknown>)[tableKey] = {
      modelName: table.modelName,
      fields: processedFields,
    };
  }

  return schemaOutput;
}

// Main execution
async function main() {
  try {
    const schema = await generateAuthSchema();
    console.log(JSON.stringify(schema, null, 2));
  } catch (error) {
    console.error("Error generating auth schema:", error);
    process.exit(1);
  }
}

// Run if executed directly (ESM compatible)
if (import.meta.main) {
  main();
}

export { generateAuthSchema };
