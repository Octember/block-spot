import { Tabs } from "../types";

interface BookingTabsProps {
  activeTab: Tabs;
  setActiveTab: (tab: Tabs) => void;
}

export const BookingTabs = ({ activeTab, setActiveTab }: BookingTabsProps) => {
  return (
    <div className="mb-6">
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          <button
            onClick={() => setActiveTab("upcoming")}
            className={`${activeTab === "upcoming"
                ? "border-yellow-500 text-yellow-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            Upcoming
          </button>
          <button
            onClick={() => setActiveTab("past")}
            className={`${activeTab === "past"
                ? "border-yellow-500 text-yellow-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            Past
          </button>
        </nav>
      </div>
    </div>
  );
}; 