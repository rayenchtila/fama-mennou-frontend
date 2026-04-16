import React, { useState } from 'react';
import FilterBar from '../components/FilterBar';
import Jobcard from '../components/Jobcard';
import Searchbar from '../components/Searchbar';
import { useTranslation } from 'react-i18next';

const JOBS_DATA = [
  { id:1, title:"Senior React Developer",   company:"TechFlow Inc.",   location:"Remote",      salary:"$80k–$120k", type:"Full-time", tags:["React","TypeScript","Node.js"],      logo:"T", remote:true,  description:"Build next-gen SaaS products with a world-class engineering team." },
  { id:2, title:"UI/UX Designer",           company:"CreativeStudio",  location:"Paris, FR",   salary:"$60k–$90k",  type:"Contract",  tags:["Figma","Tailwind","Motion"],         logo:"C", remote:false, description:"Design beautiful, accessible interfaces for web and mobile apps." },
  { id:3, title:"Digital Marketing Lead",   company:"GrowthLab",       location:"London, UK",  salary:"$50k–$75k",  type:"Full-time", tags:["SEO","Paid Ads","Analytics"],        logo:"G", remote:false, description:"Own the full marketing funnel and grow our user base globally." },
  { id:4, title:"Full-Stack Engineer",      company:"NovaSaaS",        location:"Remote",      salary:"$90k–$140k", type:"Full-time", tags:["Next.js","PostgreSQL","AWS"],         logo:"N", remote:true,  description:"Join our small, high-output team building the future of B2B software." },
  { id:5, title:"Content Strategist",       company:"BrandVoice",      location:"Dubai, UAE",  salary:"$40k–$65k",  type:"Part-time", tags:["Copywriting","Strategy","SEO"],      logo:"B", remote:true,  description:"Shape our editorial voice across blog, social, and product content." },
  { id:6, title:"DevOps Engineer",          company:"CloudNine",       location:"Remote",      salary:"$85k–$130k", type:"Full-time", tags:["Kubernetes","Terraform","CI/CD"],    logo:"D", remote:true,  description:"Automate infrastructure and reliability engineering at scale." },
];

const JobsPage = () => {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');

  const categories = ['All', 'Full-time', 'Contract', 'Part-time'];

  const filteredJobs = JOBS_DATA.filter(job => {
    const matchesSearch = searchQuery === '' ||
      job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase())) ||
      job.description.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory = activeCategory === 'All' || job.type === activeCategory;

    return matchesSearch && matchesCategory;
  });

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
          resultCount={filteredJobs.length}
          label={t("Jobs")}
        />
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mt-8">
          {filteredJobs.map(job => (
            <Jobcard key={job.id} {...job} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default JobsPage;