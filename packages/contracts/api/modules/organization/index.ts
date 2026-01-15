import { oc } from "@orpc/contract";
import { organizationListAllContract } from './listAll';

// Combine into organization admin contract
export const organizationAdminContract = oc.tag("Organization Admin").prefix("/organization/admin").router({
  listAll: organizationListAllContract,
});

export type OrganizationAdminContract = typeof organizationAdminContract;

// Re-export from individual contracts
export * from './listAll';
