import { Button } from "@atoms/button/button";
import { PageLoader } from "@atoms/page-loader";
import { Info } from "@atoms/text";
import { FormInput } from "@components/form/fields";
import { FormContext } from "@components/form/formcontext";
import { useClients } from "@features/clients/state/use-clients";
import {
  ContactsApiClient,
  FrenchDirectoryCompany,
  FrenchDirectoryEntry,
} from "@features/contacts/api-client/contacts-api-client";
import { useFrenchDirectorySearchManual } from "@features/contacts/hooks/use-french-directory";
import { Building2, MapPin } from "lucide-react";
import { useState } from "react";
import { Heading } from "@radix-ui/themes";
import Link from "@/atoms/link";

interface FrenchDirectorySearchProps {
  onSelectCompany: (
    company: FrenchDirectoryCompany,
    entries: FrenchDirectoryEntry[],
  ) => void;
  onSkip: () => void;
  initialSiren?: string;
  initialName?: string;
}

export const FrenchDirectorySearch = ({
  onSelectCompany,
  onSkip,
  initialSiren,
  initialName,
}: FrenchDirectorySearchProps) => {
  const { client: clientUser } = useClients();
  const client = clientUser?.client;

  // Determine initial search type and term based on provided values
  const getInitialSearchType = () => {
    if (initialSiren && initialSiren.length >= 9) return "siren";
    if (initialName) return "name";
    return "name";
  };

  const getInitialSearchTerm = () => {
    if (initialSiren && initialSiren.length >= 9) return initialSiren;
    if (initialName) return initialName;
    return "";
  };

  const [searchTerm, setSearchTerm] = useState(getInitialSearchTerm());
  const [searchType, setSearchType] = useState<"name" | "siren">(
    getInitialSearchType(),
  );
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const { companies, has_more, isPending, error, search } =
    useFrenchDirectorySearchManual();

  const handleSearch = () => {
    if (!searchTerm.trim()) return;

    const options: any = { limit: 50 };

    if (searchType === "siren") {
      // Clean SIREN input (remove spaces, keep only digits)
      const cleanedSiren = searchTerm.replace(/\s/g, "").replace(/[^0-9]/g, "");
      if (cleanedSiren.length < 9) {
        return; // SIREN must be 9 digits
      }
      options.number = cleanedSiren.slice(0, 9);
    } else {
      options.formal_name_starts_with = searchTerm.trim().toUpperCase();
    }

    search(options);
  };

  const handleSelectCompany = async (company: FrenchDirectoryCompany) => {
    if (!client?.id) return;

    setIsLoadingDetails(true);
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
      setIsLoadingDetails(false);
    }
  };

  return (
    <div className="grow @lg:w-full max-w-4xl mx-auto">
      <FormContext readonly={false} alwaysVisible>
        <div className="space-y-8">
          <div className="space-y-4">
            <Heading>Rechercher une entreprise française</Heading>
            <Info>
              Recherchez votre entreprise dans l'annuaire de la facturation
              électronique pour pré-remplir automatiquement les informations.
            </Info>

            <div
              className="space-y-4 p-6 bg-gray-50 rounded-lg border border-gray-200"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleSearch();
                }
              }}
            >
              <div className="flex gap-2">
                <FormInput
                  className="shrink-0 w-40"
                  label="Type de recherche"
                  type="select"
                  value={searchType}
                  onChange={(value) => {
                    setSearchType(value as "name" | "siren");
                    setSearchTerm("");
                  }}
                  options={[
                    { label: "Par nom", value: "name" },
                    { label: "Par SIREN", value: "siren" },
                  ]}
                />

                <FormInput
                  className="grow"
                  label={
                    searchType === "siren"
                      ? "Numéro SIREN"
                      : "Nom de l'entreprise"
                  }
                  placeholder={
                    searchType === "siren"
                      ? "Ex: 853322915"
                      : "Ex: ACME CORPORATION"
                  }
                  value={searchTerm}
                  onChange={setSearchTerm}
                />
              </div>

              <div className="flex justify-between items-center">
                <Button
                  theme="primary"
                  onClick={handleSearch}
                  disabled={isPending || isLoadingDetails || !searchTerm.trim()}
                >
                  Rechercher
                </Button>
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
                  Erreur: {error}
                </div>
              )}
            </div>
            <div>
              <Link
                theme="invisible"
                onClick={onSkip}
                disabled={isLoadingDetails}
              >
                Je préfère remplir manuellement
              </Link>
            </div>
          </div>

          {(isPending || isLoadingDetails) && (
            <div className="flex justify-center py-8">
              <PageLoader />
            </div>
          )}

          {!isPending && !isLoadingDetails && companies.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Heading size="4">
                  Résultats ({companies.length}
                  {has_more ? "+" : ""})
                </Heading>
                {has_more && (
                  <Info>
                    Trop de résultats. Affinez votre recherche pour voir plus
                    d'entreprises.
                  </Info>
                )}
              </div>

              <div className="space-y-2">
                {companies.map((company) => (
                  <button
                    key={company.number}
                    onClick={() => handleSelectCompany(company)}
                    disabled={isLoadingDetails}
                    className="w-full text-left p-4 bg-white border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors group disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-blue-100 rounded group-hover:bg-blue-200 transition-colors">
                        <Building2 className="w-5 h-5 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-gray-900 mb-1">
                          {company.formal_name}
                        </div>
                        <div className="text-sm text-gray-600 mb-2">
                          SIREN: {company.number}
                        </div>
                        <div className="flex items-start gap-1 text-sm text-gray-500">
                          <MapPin className="w-4 h-4 mt-0.5 shrink-0" />
                          <span>
                            {company.address}, {company.postcode} {company.city}
                            {company.country !== "FR" &&
                              ` - ${company.country}`}
                          </span>
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {!isPending &&
            !isLoadingDetails &&
            searchTerm &&
            companies.length === 0 &&
            !error && (
              <div className="text-center py-8">
                <Info>
                  Aucune entreprise trouvée. Essayez une autre recherche ou{" "}
                  <button
                    onClick={onSkip}
                    className="text-blue-600 hover:underline font-medium"
                  >
                    remplissez manuellement
                  </button>
                  .
                </Info>
              </div>
            )}
        </div>
      </FormContext>
    </div>
  );
};
