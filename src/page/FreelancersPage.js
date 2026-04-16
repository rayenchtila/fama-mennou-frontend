import React, { useState } from 'react';
import FilterBar from '../components/FilterBar';
import Freelancercard from '../components/Freelancercard';
import Searchbar from '../components/Searchbar';
import { useTranslation } from 'react-i18next';

const FREELANCERS_DATA = [
  { id:1, name:"Amira Bensalem", skill:"Brand Designer",    rate:"$85/hr",  rating:4.9, reviews:142, avatar:"AB", tags:["Branding","Figma","Illustration"], available:true,  bio:"10+ years crafting identities for startups and Fortune 500s." },
  { id:2, name:"Youssef Khalil", skill:"Full-Stack Dev",    rate:"$95/hr",  rating:5.0, reviews:89,  avatar:"YK", tags:["React","Node","MongoDB"],           available:true,  bio:"Open-source contributor. Builds scalable SaaS products end-to-end." },
  { id:3, name:"Sofia Martins",  skill:"SEO Specialist",    rate:"$70/hr",  rating:4.8, reviews:210, avatar:"SM", tags:["SEO","Content","Analytics"],         available:false, bio:"Grew organic traffic by 400% for 20+ clients across 5 industries." },
  { id:4, name:"Karim Dridi",    skill:"Motion Designer",   rate:"$90/hr",  rating:4.7, reviews:65,  avatar:"KD", tags:["After Effects","Lottie","Cinema4D"], available:true,  bio:"Award-winning animator. Clients include Spotify, Airbnb, and Nike." },
  { id:5, name:"Elena Russo",    skill:"Copywriter",        rate:"$60/hr",  rating:4.9, reviews:178, avatar:"ER", tags:["B2B Copy","Email","Landing Pages"],  available:true,  bio:"Conversion copywriter specialising in SaaS and e-commerce." },
  { id:6, name:"Mehdi Toumi",    skill:"Mobile Dev",        rate:"$100/hr", rating:5.0, reviews:55,  avatar:"MT", tags:["React Native","Flutter","iOS"],      available:false, bio:"Built apps with 1M+ downloads. Expert in cross-platform mobile." },
];

const FreelancersPage = () => {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');

  const categories = ['All', 'Design', 'Development', 'Marketing', 'Writing', 'Video'];

  const filteredFreelancers = FREELANCERS_DATA.filter(freelancer => {
    const matchesSearch = searchQuery === '' ||
      freelancer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      freelancer.skill.toLowerCase().includes(searchQuery.toLowerCase()) ||
      freelancer.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase())) ||
      freelancer.bio.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory = activeCategory === 'All' || freelancer.skill.toLowerCase().includes(activeCategory.toLowerCase());

    return matchesSearch && matchesCategory;
  });

  return (
    <div className="pt-24 pb-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-6 md:mb-8">{t("Find Freelancers")}</h1>
        <div className="mb-6">
          <Searchbar
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder={t("Search freelancers...")}
          />
        </div>
        <FilterBar
          categories={categories}
          activeCategory={activeCategory}
          onCategoryChange={setActiveCategory}
          resultCount={filteredFreelancers.length}
          label={t("Freelancers")}
        />
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mt-8">
          {filteredFreelancers.map(freelancer => (
            <Freelancercard key={freelancer.id} {...freelancer} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default FreelancersPage;