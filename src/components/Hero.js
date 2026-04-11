import { useTranslation } from 'react-i18next';

function Hero() {
  const { t } = useTranslation(); // no need for i18n here

  return (
    <div>
      <h1>{t('Find Freelancers')}</h1>
      <button>{t('Log in')}</button>
      <p>{t('Search jobs, freelancers, courses…')}</p>
    </div>
  );
}