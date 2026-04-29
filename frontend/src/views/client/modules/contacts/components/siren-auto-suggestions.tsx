import { Button } from "@atoms/button/button";
import { PageLoader } from "@atoms/page-loader";
import Link from "@atoms/link";
import { useClients } from "@features/clients/state/use-clients";
import {
  ContactsApiClient,
  FrenchDirectoryCompany,
  FrenchDirectoryEntry,
} from "@features/contacts/api-client/contacts-api-client";
import { useFrenchDirectorySearchManual } from "@features/contacts/hooks/use-french-directory";
import { Building2, MapPin } from "lucide-react";
import { useEffect, useState, useMemo, useRef } from "react";
import Fuse from "fuse.js";
import { Address } from "@features/clients/types/clients";
import { useNavigate } from "react-router-dom";
import { ROUTES, getRoute } from "@features/routes";
import { twMerge } from "tailwind-merge";

interface SirenAutoSuggestionsProps {
  businessName: string;
  businessRegisteredName: string;
  address: Address;
  onSelectCompany: (
    company: FrenchDirectoryCompany,
    entries: FrenchDirectoryEntry[],
  ) => void;
  onOpenFullSearch: () => void;
  readonly?: boolean;
  contactId: string;
}

export const SirenAutoSuggestions = ({
  businessName,
  businessRegisteredName,
  address,
  onSelectCompany,
  onOpenFullSearch,
  readonly = false,
  contactId,
}: SirenAutoSuggestionsProps) => {
  const { client: clientUser } = useClients();
  const client = clientUser?.client;
  const navigate = useNavigate();
  const [selectedCompanyLoading, setSelectedCompanyLoading] = useState<
    string | null
  >(null);
  const hasSearched = useRef(false);

  const { companies, isPending, search } = useFrenchDirectorySearchManual();

  // Auto-search only once when component mounts
  useEffect(() => {
    if (hasSearched.current) return;

    const searchName =
      businessRegisteredName?.trim() || businessName?.trim() || "";
    if (searchName && searchName.length > 2) {
      hasSearched.current = true;
      search({
        formal_name_starts_with: searchName.toUpperCase(),
        limit: 10,
      });
    }
  }, []);

  // Reorder results using Fuse.js based on address similarity
  const sortedCompanies = useMemo(() => {
    if (!companies.length || !address) return companies;

    // Build a searchable address string from the contact's address
    const contactAddress = [
      address.address_line_1,
      address.address_line_2,
      address.zip,
      address.city,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    if (!contactAddress) return companies;

    // Use Fuse.js to score each company based on address similarity
    const companiesWithScore = companies.map((company) => {
      const companyAddress = [company.address, company.postcode, company.city]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      // Use Fuse to calculate similarity score
      const fuse = new Fuse([companyAddress], {
        threshold: 0.6,
        includeScore: true,
      });

      const result = fuse.search(contactAddress);
      const score = result[0]?.score ?? 1; // Lower score = better match

      return { company, score };
    });

    // Sort by score (lower is better)
    return companiesWithScore
      .sort((a, b) => a.score - b.score)
      .map((item) => item.company)
      .slice(0, 3); // Keep only top 3 results
  }, [companies, address]);

  const handleSelectCompany = async (company: FrenchDirectoryCompany) => {
    if (!client?.id) return;

    setSelectedCompanyLoading(company.number);
    try {
      const result = await ContactsApiClient.getFrenchCompanyBySiren(
        client.id,
        company.number,
      );
      onSelectCompany(company, result.entries || []);
    } catch (_err) {
      // Fallback to just the company data if entries fetch fails
      onSelectCompany(company, []);
    } finally {
      setSelectedCompanyLoading(null);
    }
  };

  if (isPending) {
    return (
      <div className="p-3 bg-amber-50 border border-amber-200 rounded-md text-amber-800 text-sm">
        <div className="flex items-center gap-2">
          <PageLoader />
          <span>
            <strong>⚠️ Attention :</strong> Aucun numéro SIREN renseigné.
            Recherche en cours...
          </span>
        </div>
      </div>
    );
  }

  if (!sortedCompanies.length) {
    return (
      <div className="p-3 bg-amber-50 border border-amber-200 rounded-md text-amber-800 text-sm">
        <strong>⚠️ Attention :</strong> Aucun numéro SIREN renseigné.{" "}
        <Link
          onClick={onOpenFullSearch}
          className="text-amber-900 underline font-medium"
        >
          Rechercher dans l'annuaire
        </Link>{" "}
        ou le renseigner manuellement.
      </div>
    );
  }

  return (
    <div
      className={twMerge(
        "relative p-3 bg-amber-50 border border-amber-200 rounded-md space-y-3",
      )}
    >
      {readonly && (
        <div
          onClick={() =>
            navigate(getRoute(ROUTES.ContactsEdit, { id: contactId }))
          }
          className="absolute top-0 left-0 w-full h-full bg-black/10 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity cursor-pointer rounded-md"
        >
          <Button>Passer en édition</Button>
        </div>
      )}
      <div className="text-amber-800 text-sm">
        <strong>⚠️ Attention :</strong> Aucun numéro SIREN renseigné. Voici des
        entreprises correspondantes :
      </div>

      <div className="space-y-1">
        {sortedCompanies.map((company) => (
          <button
            key={company.number}
            onClick={() => {
              if (readonly) {
                navigate(getRoute(ROUTES.ContactsEdit, { id: contactId }));
              } else {
                handleSelectCompany(company);
              }
            }}
            disabled={!readonly && selectedCompanyLoading !== null}
            className="w-full text-left px-2 py-1 bg-white border border-amber-300 rounded hover:border-amber-500 hover:bg-amber-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-xs"
          >
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <Building2 className="w-3 h-3 text-amber-600 shrink-0" />
                <span className="font-medium text-gray-900 truncate flex-shrink min-w-0">
                  {company.formal_name}
                </span>
                <span className="text-amber-700 shrink-0">·</span>
                <span className="text-gray-600 shrink-0">{company.number}</span>
                <span className="text-amber-700 shrink-0">·</span>
                <span className="text-gray-600 truncate flex-shrink min-w-0">
                  {company.address}, {company.postcode} {company.city}
                </span>
                {!readonly && selectedCompanyLoading === company.number && (
                  <div className="shrink-0 ml-auto">
                    <PageLoader />
                  </div>
                )}
              </div>
            </div>
          </button>
        ))}
      </div>

      <div className="text-xs text-amber-700">
        Pas le bon résultat ?{" "}
        <Link
          onClick={onOpenFullSearch}
          className="text-amber-900 underline font-medium"
        >
          Rechercher dans l'annuaire complet
        </Link>
      </div>
    </div>
  );
};
