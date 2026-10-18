// The category taxonomy shared by the Freelancers, Clients and Courses
// directories (the server filters on these exact English keys; labels are
// translated through i18n at render time with t(category)).
export const CATEGORIES = ['All', 'Technology', 'Design', 'Marketing', 'Writing', 'E-commerce', 'Finance'];

// Material Symbols glyph per category.
export const CATEGORY_ICON = {
  All: 'apps',
  Technology: 'code',
  Design: 'palette',
  Marketing: 'campaign',
  Writing: 'edit_note',
  'E-commerce': 'shopping_bag',
  Finance: 'payments',
};
