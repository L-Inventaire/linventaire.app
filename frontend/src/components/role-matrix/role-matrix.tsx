import { Button } from "@atoms/button/button";
import { BaseSmall, Info } from "@atoms/text";
import { Role } from "@features/clients/types/clients";
import { CheckIcon as CheckIconSolid } from "@heroicons/react/24/solid";
import { useState } from "react";

type ModulePermission = {
  module: string;
  name: string;
  description: string;
  read: boolean;
  write: boolean;
  manage: boolean;
};

const MODULES = [
  {
    key: "CLIENT",
    name: "Configuration",
    description: "Configuration générale de l'entreprise",
  },
  {
    key: "CONTACTS",
    name: "Contacts",
    description: "Gérer les clients et fournisseurs",
  },
  {
    key: "ARTICLES",
    name: "Articles",
    description: "Gérer le catalogue produits/services",
  },
  {
    key: "STOCK",
    name: "Stock",
    description: "Gérer les inventaires et réceptions",
  },
  {
    key: "INVOICES",
    name: "Factures",
    description: "Créer et gérer les factures",
  },
  {
    key: "QUOTES",
    name: "Devis",
    description: "Créer et gérer les devis",
  },
  {
    key: "SUPPLIER_INVOICES",
    name: "Factures fournisseurs",
    description: "Gérer les factures des fournisseurs",
  },
  {
    key: "SUPPLIER_QUOTES",
    name: "Devis fournisseurs",
    description: "Gérer les devis des fournisseurs",
  },
  {
    key: "ACCOUNTING",
    name: "Comptabilité",
    description: "Gestion comptable et rapports",
  },
  {
    key: "CRM",
    name: "CRM",
    description: "Gestion de la relation client",
  },
  {
    key: "ONSITE_SERVICES",
    name: "Services",
    description: "Gérer les interventions sur site",
  },
  {
    key: "DATA_ANALYSIS",
    name: "Analyses",
    description: "Tableaux de bord et analyses",
  },
  {
    key: "USERS",
    name: "Utilisateurs",
    description: "Gestion des utilisateurs et permissions",
  },
];

const PRESETS = {
  admin: {
    name: "Administrateur",
    description: "Accès complet à tous les modules",
    roles: MODULES.flatMap((m) => [`${m.key}_MANAGE` as Role]),
  },
  manager: {
    name: "Manager",
    description: "Tout sauf la configuration de l'entreprise",
    roles: MODULES.filter((m) => m.key !== "CLIENT")
      .flatMap((m) => [`${m.key}_MANAGE` as Role])
      .concat(["CLIENT_READ" as Role]),
  },
  employee: {
    name: "Employé",
    description: "Tout en écriture sauf factures et commandes fournisseurs",
    roles: MODULES.filter(
      (m) =>
        ![
          "CLIENT",
          "INVOICES",
          "SUPPLIER_INVOICES",
          "SUPPLIER_QUOTES",
        ].includes(m.key)
    )
      .flatMap((m) => [`${m.key}_WRITE` as Role])
      .concat([
        "CLIENT_READ",
        "INVOICES_READ",
        "SUPPLIER_INVOICES_READ",
        "SUPPLIER_QUOTES_READ",
      ] as Role[]),
  },
  readonly: {
    name: "Lecture seule",
    description: "Consultation uniquement",
    roles: MODULES.flatMap((m) => [`${m.key}_READ` as Role]),
  },
};

interface RoleMatrixProps {
  value: Role[];
  onChange: (roles: Role[]) => void;
  disabled?: boolean;
  className?: string;
}

export const RoleMatrix = ({
  value,
  onChange,
  disabled,
  className,
}: RoleMatrixProps) => {
  const [showPresets, setShowPresets] = useState(true);

  // Convert role array to module permissions
  const getModulePermissions = (): ModulePermission[] => {
    return MODULES.map((module) => ({
      module: module.key,
      name: module.name,
      description: module.description,
      read:
        value.includes(`${module.key}_READ` as Role) ||
        value.includes(`${module.key}_WRITE` as Role) ||
        value.includes(`${module.key}_MANAGE` as Role),
      write:
        value.includes(`${module.key}_WRITE` as Role) ||
        value.includes(`${module.key}_MANAGE` as Role),
      manage: value.includes(`${module.key}_MANAGE` as Role),
    }));
  };

  // Update role based on permission level
  const updatePermission = (
    moduleKey: string,
    level: "read" | "write" | "manage",
    enabled: boolean
  ) => {
    let newRoles = [...value];

    // Remove all existing permissions for this module
    newRoles = newRoles.filter(
      (role) =>
        !role.startsWith(`${moduleKey}_READ`) &&
        !role.startsWith(`${moduleKey}_WRITE`) &&
        !role.startsWith(`${moduleKey}_MANAGE`)
    );

    if (enabled) {
      // Add the requested permission level
      newRoles.push(`${moduleKey}_${level.toUpperCase()}` as Role);
    }

    onChange(newRoles);
  };

  const applyPreset = (presetKey: keyof typeof PRESETS) => {
    onChange(PRESETS[presetKey].roles);
  };

  const clearAll = () => {
    onChange([]);
  };

  // Detect which preset is currently active
  const getActivePreset = (): keyof typeof PRESETS | null => {
    if (value.length === 0) return null;

    for (const [key, preset] of Object.entries(PRESETS)) {
      const presetRoles = preset.roles.sort();
      const currentRoles = value.sort();

      if (
        presetRoles.length === currentRoles.length &&
        presetRoles.every((role, index) => role === currentRoles[index])
      ) {
        return key as keyof typeof PRESETS;
      }
    }
    return null;
  };

  const activePreset = getActivePreset();
  const modulePermissions = getModulePermissions();
  const hasAnyPermissions = value.length > 0;

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Presets */}
      {showPresets && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <BaseSmall className="font-medium">Modèles prédéfinis</BaseSmall>
            <Button
              size="sm"
              theme="invisible"
              onClick={() => setShowPresets(false)}
            >
              Personnaliser
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(PRESETS).map(([key, preset]) => {
              const isActive = activePreset === key;
              return (
                <Button
                  key={key}
                  size="sm"
                  theme={isActive ? "primary" : "secondary"}
                  disabled={disabled}
                  onClick={() => applyPreset(key as keyof typeof PRESETS)}
                  className={`text-left p-3 h-auto flex-col items-start ${
                    isActive ? "ring-2 ring-blue-500 ring-offset-1" : ""
                  }`}
                >
                  <div
                    className={`font-medium ${
                      isActive ? "flex items-center" : ""
                    }`}
                  >
                    {preset.name}
                    {isActive && <span className="ml-2 text-xs">✓</span>}
                  </div>
                  <BaseSmall
                    className={`mt-1 ${
                      isActive ? "text-blue-100" : "text-gray-500"
                    }`}
                  >
                    {preset.description}
                  </BaseSmall>
                </Button>
              );
            })}
          </div>
        </div>
      )}

      {/* Custom permissions matrix */}
      {!showPresets && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <BaseSmall className="font-medium">
              Permissions personnalisées
            </BaseSmall>
            <div className="space-x-2">
              <Button
                size="sm"
                theme="invisible"
                onClick={clearAll}
                disabled={disabled || !hasAnyPermissions}
              >
                Tout effacer
              </Button>
              <Button
                size="sm"
                theme="invisible"
                onClick={() => setShowPresets(true)}
              >
                Modèles
              </Button>
            </div>
          </div>

          {/* Permission matrix */}
          <div className="border rounded-lg overflow-hidden">
            {/* Header */}
            <div className="bg-gray-50 px-4 py-3 border-b grid grid-cols-12 gap-2 text-sm font-medium">
              <div className="col-span-6">Module</div>
              <div className="col-span-2 text-center">Lecture</div>
              <div className="col-span-2 text-center">Écriture</div>
              <div className="col-span-2 text-center">Administration</div>
            </div>

            {/* Rows */}
            {modulePermissions.map((module, index) => (
              <div
                key={module.module}
                className={`px-4 py-3 grid grid-cols-12 gap-2 items-center ${
                  index !== modulePermissions.length - 1 ? "border-b" : ""
                } hover:bg-gray-25`}
              >
                <div className="col-span-6">
                  <div className="font-medium text-sm">{module.name}</div>
                  <BaseSmall className="text-gray-500 mt-1">
                    {module.description}
                  </BaseSmall>
                </div>

                {/* Read permission */}
                <div className="col-span-2 flex justify-center">
                  <button
                    type="button"
                    disabled={disabled}
                    onClick={() =>
                      updatePermission(module.module, "read", !module.read)
                    }
                    className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                      module.read
                        ? "bg-blue-500 border-blue-500 text-white hover:bg-blue-600"
                        : "border-gray-300 hover:border-gray-400"
                    } ${
                      disabled
                        ? "opacity-50 cursor-not-allowed"
                        : "cursor-pointer"
                    }`}
                  >
                    {module.read && <CheckIconSolid className="w-3 h-3" />}
                  </button>
                </div>

                {/* Write permission */}
                <div className="col-span-2 flex justify-center">
                  <button
                    type="button"
                    disabled={disabled}
                    onClick={() =>
                      updatePermission(module.module, "write", !module.write)
                    }
                    className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                      module.write
                        ? "bg-green-500 border-green-500 text-white hover:bg-green-600"
                        : "border-gray-300 hover:border-gray-400"
                    } ${
                      disabled
                        ? "opacity-50 cursor-not-allowed"
                        : "cursor-pointer"
                    }`}
                  >
                    {module.write && <CheckIconSolid className="w-3 h-3" />}
                  </button>
                </div>

                {/* Manage permission */}
                <div className="col-span-2 flex justify-center">
                  <button
                    type="button"
                    disabled={disabled}
                    onClick={() =>
                      updatePermission(module.module, "manage", !module.manage)
                    }
                    className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                      module.manage
                        ? "bg-red-500 border-red-500 text-white hover:bg-red-600"
                        : "border-gray-300 hover:border-gray-400"
                    } ${
                      disabled
                        ? "opacity-50 cursor-not-allowed"
                        : "cursor-pointer"
                    }`}
                  >
                    {module.manage && <CheckIconSolid className="w-3 h-3" />}
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Legend */}
          <Info className="text-xs">
            <div className="space-y-1">
              <div>
                <span className="inline-block w-3 h-3 rounded bg-blue-500 mr-2"></span>
                <strong>Lecture</strong>: Voir les données uniquement
              </div>
              <div>
                <span className="inline-block w-3 h-3 rounded bg-green-500 mr-2"></span>
                <strong>Écriture</strong>: Modifier les données (inclut la
                lecture)
              </div>
              <div>
                <span className="inline-block w-3 h-3 rounded bg-red-500 mr-2"></span>
                <strong>Administration</strong>: Niveau le plus élevé,
                paramètres et suppressions (inclut écriture et lecture)
              </div>
            </div>
          </Info>
        </div>
      )}
    </div>
  );
};
