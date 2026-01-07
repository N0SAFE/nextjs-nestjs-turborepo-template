import type { Auth } from "@/auth";
import { ConfigurableModuleBuilder } from "@nestjs/common";
import type { 
	ApiMethodsWithAdminPlugin, 
	ApiMethodsWithOrganizationPlugin 
} from "@repo/auth/permissions/plugins";
import type { 
	platformBuilder,
	organizationBuilder 
} from "@repo/auth/permissions";

/**
 * Auth configuration must have both admin and organization plugins
 */
export type AuthWithPlugins = 
	ApiMethodsWithAdminPlugin<typeof platformBuilder> & 
	ApiMethodsWithOrganizationPlugin<typeof organizationBuilder>;

export interface AuthModuleOptions<A extends AuthWithPlugins = Auth> {
	auth: A;
	disableTrustedOriginsCors?: boolean;
	disableBodyParser?: boolean;
	disableGlobalAuthGuard?: boolean;
};

export const MODULE_OPTIONS_TOKEN = Symbol("AUTH_MODULE_OPTIONS");

export const { ConfigurableModuleClass, OPTIONS_TYPE, ASYNC_OPTIONS_TYPE } =
	new ConfigurableModuleBuilder<AuthModuleOptions>({
		optionsInjectionToken: MODULE_OPTIONS_TOKEN,
	})
		.setClassMethodName("forRoot")
		.setExtras(
			{
				isGlobal: true,
				disableTrustedOriginsCors: false,
				disableBodyParser: false,
				disableGlobalAuthGuard: false,
			},
			(def, extras) => {
				return {
					...def,
					exports: [MODULE_OPTIONS_TOKEN],
					global: extras.isGlobal,
				};
			},
		)
		.build();
