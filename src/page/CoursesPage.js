import React, { useState } from 'react';
import FilterBar from '../components/FilterBar';
import Coursecard from '../components/Coursecard';
import Searchbar from '../components/Searchbar';
import { useTranslation } from 'react-i18next';

const COURSES_DATA = [
  { id:1, title:"Advanced React Patterns",       author:"Youssef Khalil",  price:79,  category:"Development", students:1420, rating:4.9, level:"Advanced",     img:"⚛️", duration:"12h",    lessons:38, description:"Master render patterns, performance, and scalable architecture in React." },
  { id:2, title:"Brand Identity from Zero",      author:"Amira Bensalem",  price:0,   category:"Design",       students:3800, rating:4.8, level:"Beginner",     img:"🎨", duration:"8h",     lessons:24, description:"Learn to build memorable brand identities using Figma and design principles." },
  { id:3, title:"SEO Mastery 2024",              author:"Sofia Martins",   price:49,  category:"SEO",          students:2100, rating:4.7, level:"Intermediate", img:"🔍", duration:"6h 30m", lessons:20, description:"Rank #1 on Google. Technical SEO, content strategy, and link building." },
  { id:4, title:"Motion Design Fundamentals",   author:"Karim Dridi",     price:59,  category:"Video",        students:980,  rating:5.0, level:"Beginner",     img:"✨", duration:"10h",    lessons:30, description:"Create stunning animations with After Effects and Lottie for web." },
  { id:5, title:"High-Converting Copy",          author:"Elena Russo",     price:39,  category:"Writing",      students:1750, rating:4.9, level:"Intermediate", img:"✍️", duration:"5h",     lessons:16, description:"Write copy that converts. Landing pages, emails, and product messaging." },
  { id:6, title:"Mobile App Architecture",       author:"Mehdi Toumi",     price:89,  category:"Development", students:620,  rating:5.0, level:"Advanced", img:"📱", duration:"15h", lessons:45, description:"Design scalable mobile apps with modern architecture patterns." },
];

const CoursesPage = () => {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');

  const categories = ['All', 'Development', 'Design', 'SEO', 'Video', 'Writing'];

  const filteredCourses = COURSES_DATA.filter(course => {
    const matchesSearch = searchQuery === '' ||
      course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.description.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory = activeCategory === 'All' || course.category === activeCategory;

    return matchesSearch && matchesCategory;
  });

  return (
    <div className="pt-24 pb-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-6 md:mb-8">{t("Share Courses")}</h1>
        <div className="mb-6">
          <Searchbar
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder={t("Search courses...")}
          />
        </div>
        <FilterBar
          categories={categories}
          activeCategory={activeCategory}
          onCategoryChange={setActiveCategory}
          resultCount={filteredCourses.length}
          label={t("Share Courses")}
        />
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mt-8">
          {filteredCourses.map(course => (
            <Coursecard key={course.id} {...course} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default CoursesPage;