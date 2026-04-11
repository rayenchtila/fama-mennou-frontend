import React, { useState } from 'react';
import FilterBar from '../components/FilterBar';
import Searchbar from '../components/Searchbar';
import { useTranslation } from 'react-i18next';

const CLIENTS_DATA = [
  { id:1, name:"TechFlow Inc.",    industry:"Technology",  budget:"$5k–$20k",  location:"Remote",      avatar:"T", tags:["React","TypeScript","SaaS"],         verified:true,  bio:"Fast-growing SaaS company looking for top-tier developers and designers." },
  { id:2, name:"CreativeStudio",   industry:"Design",      budget:"$2k–$10k",  location:"Paris, FR",   avatar:"C", tags:["Branding","UI/UX","Motion"],         verified:true,  bio:"Boutique creative agency hiring freelancers for ongoing client projects." },
  { id:3, name:"GrowthLab",        industry:"Marketing",   budget:"$3k–$15k",  location:"London, UK",  avatar:"G", tags:["SEO","Paid Ads","Analytics"],        verified:false, bio:"Performance marketing agency scaling campaigns for e-commerce brands." },
  { id:4, name:"NovaSaaS",         industry:"Technology",  budget:"$10k–$50k", location:"Remote",      avatar:"N", tags:["Next.js","PostgreSQL","AWS"],         verified:true,  bio:"B2B software startup building the next generation of productivity tools." },
  { id:5, name:"BrandVoice",       industry:"Writing",     budget:"$1k–$5k",   location:"Dubai, UAE",  avatar:"B", tags:["Copywriting","Strategy","Content"],  verified:true,  bio:"Content-first brand studio producing editorial and product copy at scale." },
  { id:6, name:"CloudNine",        industry:"Technology",  budget:"$8k–$30k",  location:"Remote",      avatar:"D", tags:["Kubernetes","Terraform","CI/CD"],    verified:false, bio:"Infrastructure company looking for DevOps engineers and cloud architects." },
];

const ClientsPage = () => {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');

  const categories = ['All', 'Technology', 'Design', 'Marketing', 'Writing'];

  const filteredClients = CLIENTS_DATA.filter(client => {
    const matchesSearch = searchQuery === '' ||
      client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.industry.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase())) ||
      client.bio.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory = activeCategory === 'All' || client.industry === activeCategory;

    return matchesSearch && matchesCategory;
  });

  return (
    <div className="py-12">
      <div className="container mx-auto px-4">
        <h1 className="text-4xl font-bold mb-8">{t("Find Clients")}</h1>
        <div className="mb-6">
          <Searchbar
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder={t("Search clients...")}
          />
        </div>
        <FilterBar
          categories={categories}
          activeCategory={activeCategory}
          onCategoryChange={setActiveCategory}
          resultCount={filteredClients.length}
          label={t("Clients")}
        />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
          {filteredClients.map(client => (
            <div key={client.id} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 hover:shadow-lg transition-shadow duration-200">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold text-lg">
                    {client.avatar}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-slate-900 dark:text-white">{client.name}</h3>
                      {client.verified && (
                        <span className="text-indigo-500" title="Verified">✔</span>
                      )}
                    </div>
                    <p className="text-sm text-slate-500 dark:text-slate-400">{client.industry}</p>
                  </div>
                </div>
                <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-3 py-1 rounded-full">
                  {client.budget}
                </span>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-300 mb-4 leading-relaxed">{client.bio}</p>
              <div className="flex flex-wrap gap-2 mb-4">
                {client.tags.map(tag => (
                  <span key={tag} className="text-xs font-medium px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                    {tag}
                  </span>
                ))}
              </div>
              <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
                <span className="text-xs text-slate-400">{client.location}</span>
                <button className="text-sm font-semibold text-indigo-600 dark:text-indigo-400 hover:underline">
                  {t("View Profile →")}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ClientsPage;