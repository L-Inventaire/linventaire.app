import { BaseSmall, Info } from "@atoms/text";
import { Role } from "@features/clients/types/clients";
import { CheckIcon } from "@heroicons/react/24/solid";
import { MinusIcon, XMarkIcon } from "@heroicons/react/24/outline";

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

type UserWithRoles = {
  user_id: string;
  user: { full_name?: string; email: string; id?: string };
  roles: { list: Role[] };
};

type PermissionStatus = "all" | "some" | "none";

interface RoleComparisonProps {
  users: UserWithRoles[];
  className?: string;
}

export const RoleComparison = ({ users, className }: RoleComparisonProps) => {
  const getPermissionStatus = (
    moduleKey: string,
    level: "read" | "write" | "manage"
  ): PermissionStatus => {
    const usersWithPermission = users.filter((user) => {
      const roles = user.roles.list;
      // Check if user has this permission level or higher
      if (level === "read") {
        return (
          roles.includes(`${moduleKey}_READ` as Role) ||
          roles.includes(`${moduleKey}_WRITE` as Role) ||
          roles.includes(`${moduleKey}_MANAGE` as Role)
        );
      } else if (level === "write") {
        return (
          roles.includes(`${moduleKey}_WRITE` as Role) ||
          roles.includes(`${moduleKey}_MANAGE` as Role)
        );
      } else {
        return roles.includes(`${moduleKey}_MANAGE` as Role);
      }
    });

    if (usersWithPermission.length === 0) return "none";
    if (usersWithPermission.length === users.length) return "all";
    return "some";
  };

  const getStatusIcon = (status: PermissionStatus) => {
    switch (status) {
      case "all":
        return <CheckIcon className="w-4 h-4 text-green-600" />;
      case "some":
        return <MinusIcon className="w-4 h-4 text-yellow-600" />;
      case "none":
        return <XMarkIcon className="w-4 h-4 text-red-400" />;
    }
  };

  const getStatusLabel = (status: PermissionStatus) => {
    switch (status) {
      case "all":
        return "Tous";
      case "some":
        return "Certains";
      case "none":
        return "Aucun";
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <div>
        <BaseSmall className="font-medium mb-2">
          Comparaison des permissions pour {users.length} utilisateurs
        </BaseSmall>
        <Info className="text-xs mb-4">
          Cette vue montre quels utilisateurs ont quelles permissions. Vous
          pouvez ensuite appliquer des permissions uniformes.
        </Info>
      </div>

      <div className="border rounded-lg overflow-hidden">
        {/* Header */}
        <div className="bg-gray-50 px-4 py-3 border-b grid grid-cols-12 gap-2 text-sm font-medium">
          <div className="col-span-6">Module</div>
          <div className="col-span-2 text-center">Lecture</div>
          <div className="col-span-2 text-center">Écriture</div>
          <div className="col-span-2 text-center">Administration</div>
        </div>

        {/* Rows */}
        {MODULES.map((module, index) => (
          <div
            key={module.key}
            className={`px-4 py-3 grid grid-cols-12 gap-2 items-center ${
              index !== MODULES.length - 1 ? "border-b" : ""
            } hover:bg-gray-25`}
          >
            <div className="col-span-6">
              <div className="font-medium text-sm">{module.name}</div>
              <BaseSmall className="text-gray-500 mt-1">
                {module.description}
              </BaseSmall>
            </div>

            {/* Read permission status */}
            <div className="col-span-2 flex items-center justify-center space-x-2">
              {getStatusIcon(getPermissionStatus(module.key, "read"))}
              <BaseSmall className="text-gray-600">
                {getStatusLabel(getPermissionStatus(module.key, "read"))}
              </BaseSmall>
            </div>

            {/* Write permission status */}
            <div className="col-span-2 flex items-center justify-center space-x-2">
              {getStatusIcon(getPermissionStatus(module.key, "write"))}
              <BaseSmall className="text-gray-600">
                {getStatusLabel(getPermissionStatus(module.key, "write"))}
              </BaseSmall>
            </div>

            {/* Manage permission status */}
            <div className="col-span-2 flex items-center justify-center space-x-2">
              {getStatusIcon(getPermissionStatus(module.key, "manage"))}
              <BaseSmall className="text-gray-600">
                {getStatusLabel(getPermissionStatus(module.key, "manage"))}
              </BaseSmall>
            </div>
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex items-center space-x-6 text-xs">
        <div className="flex items-center space-x-1">
          <CheckIcon className="w-4 h-4 text-green-600" />
          <span>Tous les utilisateurs</span>
        </div>
        <div className="flex items-center space-x-1">
          <MinusIcon className="w-4 h-4 text-yellow-600" />
          <span>Certains utilisateurs</span>
        </div>
        <div className="flex items-center space-x-1">
          <XMarkIcon className="w-4 h-4 text-red-400" />
          <span>Aucun utilisateur</span>
        </div>
      </div>
    </div>
  );
};
