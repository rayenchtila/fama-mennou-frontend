import React from 'react';
import FilterBar from '../components/FilterBar';
import Jobcard from '../components/Jobcard';
import Coursecard from '../components/Coursecard';
import { useTranslation } from 'react-i18next';
import FAQ from '../components/FAQ';
import Reveal from '../components/Reveal'; 
import { motion } from 'framer-motion';

// Fixed Imports: Using './' because these are in src/page/ with Home.js
import FreelancersPage from './FreelancersPage';
import ClientsPage from './ClientsPage'; 

const JOBS_DATA = [
  { id:1, title:"Senior React Developer", company:"TechFlow Inc.", location:"Remote", salary:"$80k–$120k", type:"Full-time", tags:["React","TypeScript","Node.js"], logo:"T", remote:true, description:"Build next-gen SaaS products with a world-class engineering team." },
  { id:2, title:"UI/UX Designer", company:"CreativeStudio", location:"Paris, FR", salary:"$60k–$90k", type:"Contract", tags:["Figma","Tailwind","Motion"], logo:"C", remote:false, description:"Design beautiful, accessible interfaces for web and mobile apps." },
  { id:3, title:"Digital Marketing Lead", company:"GrowthLab", location:"London, UK", salary:"$50k–$75k", type:"Full-time", tags:["SEO","Paid Ads","Analytics"], logo:"G", remote:false, description:"Own the full marketing funnel and grow our user base globally." },
  { id:4, title:"Full-Stack Engineer", company:"NovaSaaS", location:"Remote", salary:"$90k–$140k", type:"Full-time", tags:["Next.js","PostgreSQL","AWS"], logo:"N", remote:true, description:"Join our small, high-output team building the future of B2B software." },
  { id:5, title:"Content Strategist", company:"BrandVoice", location:"Dubai, UAE", salary:"$40k–$65k", type:"Part-time", tags:["Copywriting","Strategy","SEO"], logo:"B", remote:true, description:"Shape our editorial voice across blog, social, and product content." },
  { id:6, title:"DevOps Engineer", company:"CloudNine", location:"Remote", salary:"$85k–$130k", type:"Full-time", tags:["Kubernetes","Terraform","CI/CD"], logo:"D", remote:true, description:"Automate infrastructure and reliability engineering at scale." },
];

const COURSES_DATA = [
  { id:1, title:"Advanced React Patterns", author:"Youssef Khalil", price:79, category:"Development", students:1420, rating:4.9, level:"Advanced", img:"⚛️", duration:"12h", lessons:38, description:"Master render patterns, performance, and scalable architecture in React." },
  { id:2, title:"Brand Identity from Zero", author:"Amira Bensalem", price:0, category:"Design", students:3800, rating:4.8, level:"Beginner", img:"🎨", duration:"8h", lessons:24, description:"Learn to build memorable brand identities using Figma and design principles." },
  { id:3, title:"SEO Mastery 2024", author:"Sofia Martins", price:49, category:"SEO", students:2100, rating:4.7, level:"Intermediate", img:"🔍", duration:"6h 30m", lessons:20, description:"Rank #1 on Google. Technical SEO, content strategy, and link building." },
  { id:4, title:"Motion Design Fundamentals", author:"Karim Dridi", price:59, category:"Video", students:980, rating:5.0, level:"Beginner", img:"✨", duration:"10h", lessons:30, description:"Create stunning animations with After Effects and Lottie for web." },
  { id:5, title:"High-Converting Copy", author:"Elena Russo", price:39, category:"Writing", students:1750, rating:4.9, level:"Intermediate", img:"✍️", duration:"5h", lessons:16, description:"Write copy that converts. Landing pages, emails, and product messaging." },
  { id:6, title:"Mobile App Architecture", author:"Mehdi Toumi", price:89, category:"Development", students:620, rating:5.0, level:"Advanced", img:"📱", duration:"15h", lessons:45, description:"Design scalable mobile apps with modern architecture patterns." },
];

const Home = () => {
  const { t } = useTranslation();

  return (
    <div>
      <Reveal>
        <FilterBar />
      </Reveal>

      <section className="py-12 bg-gray-50 overflow-hidden">
        <div className="container mx-auto px-4">
          <Reveal>
            <h2 className="text-3xl font-bold mb-8">{t("Latest Jobs")}</h2>
          </Reveal>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {JOBS_DATA.slice(0, 3).map((job, index) => (
              <motion.div
                key={job.id}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: false }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Jobcard {...job} />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-12 overflow-hidden">
        <div className="container mx-auto px-4">
          <Reveal>
            <h2 className="text-3xl font-bold mb-8">{t("Popular Courses")}</h2>
          </Reveal>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {COURSES_DATA.slice(0, 3).map((course, index) => (
              <motion.div
                key={course.id}
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: false }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Coursecard {...course} />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <Reveal>
        <FreelancersPage />
      </Reveal>

      <Reveal>
        <ClientsPage />
      </Reveal>

      <Reveal>
        <FAQ />
      </Reveal>
    </div>
  );
};

export default Home;                                                                                                                                                                                                                                                                                                                                                                                             