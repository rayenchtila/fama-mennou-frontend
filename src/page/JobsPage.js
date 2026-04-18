import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import FilterBar from '../components/FilterBar';
import Searchbar from '../components/Searchbar';
import { useTranslation } from 'react-i18next';

const JobsPage = () => {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [activeCategory, setActiveCategory] = useState('All');

  const categories = ['All', 'Full-time', 'Contract', 'Part-time'];

  return (
    <div className="pt-24 pb-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-6 md:mb-8">{t("Find Jobs")}</h1>
        <div className="mb-6">
          <Searchbar
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder={t("Search jobs...")}
          />
        </div>
        <FilterBar
          categories={categories}
          activeCategory={activeCategory}
          onCategoryChange={setActiveCategory}
          resultCount={0}
          label={t("Jobs")}
        />
        <div className="text-center py-16 text-slate-400 dark:text-slate-500">
          <p className="text-lg font-medium">Aucun emploi trouvé</p>
          <p className="text-sm mt-1">Aucune offre disponible pour le moment.</p>
        </div>
      </div>
    </div>
  );
};

export default JobsPage;
