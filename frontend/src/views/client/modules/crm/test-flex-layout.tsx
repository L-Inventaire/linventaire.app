import React from "react";

export const TestFlexLayout = () => {
  return (
    <div className="h-full w-full bg-gray-100">
      {/* Main container - full height and width */}
      <div className="h-full w-full flex flex-col bg-white rounded-lg shadow-lg">
        {/* Content area - takes remaining height */}
        <div className="flex-1 flex overflow-hidden p-4 gap-4">
          {/* Column 1 */}
          <div className="flex-1 min-w-0 bg-red-50 border-2 border-red-200 rounded-lg flex flex-col">
            <div className="p-3 bg-red-100 text-red-800 font-semibold flex-shrink-0">
              Column 1
            </div>
            <div className="flex-1 overflow-y-auto p-3">
              <div className="space-y-2">
                {Array.from({ length: 20 }, (_, i) => (
                  <div key={i} className="bg-white p-3 rounded shadow border">
                    <h3 className="font-bold">Card {i + 1}</h3>
                    <p className="text-sm text-gray-600">
                      This is a very long text content that should wrap properly
                      within the column bounds. Lorem ipsum dolor sit amet,
                      consectetur adipiscing elit. Sed do eiusmod tempor
                      incididunt ut labore et dolore magna aliqua. Ut enim ad
                      minim veniam, quis nostrud exercitation ullamco laboris
                      nisi ut aliquip ex ea commodo consequat.
                    </p>
                    <div className="mt-2 flex justify-between items-center">
                      <span className="text-xs bg-red-100 px-2 py-1 rounded">
                        Tag {i + 1}
                      </span>
                      <span className="text-xs text-gray-500">
                        User {i + 1}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Column 2 */}
          <div className="flex-1 min-w-0 bg-blue-50 border-2 border-blue-200 rounded-lg flex flex-col">
            <div className="p-3 bg-blue-100 text-blue-800 font-semibold flex-shrink-0">
              Column 2
            </div>
            <div className="flex-1 overflow-y-auto p-3">
              <div className="space-y-2">
                {Array.from({ length: 15 }, (_, i) => (
                  <div key={i} className="bg-white p-3 rounded shadow border">
                    <h3 className="font-bold">Item {i + 1}</h3>
                    <p className="text-sm text-gray-600">
                      Another long text that demonstrates how content should
                      behave within flex constraints. This text should wrap and
                      not cause the column to expand beyond its allocated space.
                      Pellentesque habitant morbi tristique senectus et netus et
                      malesuada fames ac turpis egestas.
                    </p>
                    <div className="mt-2">
                      <span className="text-xs bg-blue-100 px-2 py-1 rounded mr-2">
                        Category {i + 1}
                      </span>
                      <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                        Status
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Column 3 */}
          <div className="flex-1 min-w-0 bg-green-50 border-2 border-green-200 rounded-lg flex flex-col">
            <div className="p-3 bg-green-100 text-green-800 font-semibold flex-shrink-0">
              Column 3
            </div>
            <div className="flex-1 overflow-y-auto p-3">
              <div className="space-y-2">
                {Array.from({ length: 25 }, (_, i) => (
                  <div key={i} className="bg-white p-3 rounded shadow border">
                    <h3 className="font-bold">Task {i + 1}</h3>
                    <p className="text-sm text-gray-600">
                      Testing very very very very very very very very very very
                      long content that might try to break the layout.
                      Supercalifragilisticexpialidocious
                      antidisestablishmentarianism
                      pneumonoultramicroscopicsilicovolcanoconiosisverylongwordsthatdonthavespaces.
                      This should still wrap properly and not affect other
                      columns.
                    </p>
                    <div className="mt-2 flex flex-wrap gap-1">
                      <span className="text-xs bg-green-100 px-2 py-1 rounded">
                        Priority High
                      </span>
                      <span className="text-xs bg-yellow-100 px-2 py-1 rounded">
                        Due Soon
                      </span>
                      <span className="text-xs bg-purple-100 px-2 py-1 rounded">
                        Team Alpha
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Column 4 */}
          <div className="flex-1 min-w-0 bg-purple-50 border-2 border-purple-200 rounded-lg flex flex-col">
            <div className="p-3 bg-purple-100 text-purple-800 font-semibold flex-shrink-0">
              Column 4
            </div>
            <div className="flex-1 overflow-y-auto p-3">
              <div className="space-y-2">
                {Array.from({ length: 10 }, (_, i) => (
                  <div key={i} className="bg-white p-3 rounded shadow border">
                    <h3 className="font-bold">Record {i + 1}</h3>
                    <p className="text-sm text-gray-600">
                      Final column with content to test the complete flex
                      behavior. Each column should take exactly 1/4 of the
                      available width regardless of content. The content should
                      scroll vertically when it exceeds the column height.
                    </p>
                    <div className="mt-2">
                      <div className="flex justify-between items-center">
                        <span className="text-xs bg-purple-100 px-2 py-1 rounded">
                          Final
                        </span>
                        <span className="text-xs text-gray-500">Complete</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
