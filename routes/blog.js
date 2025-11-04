import express from 'express';

// Controladores
import {
  getAllPublishedPosts,
  getAllAdminPosts,
  getPostBySlug,
  getPostById,
  getFeaturedPosts,
  getPopularPosts,
  searchPosts,
  createPost,
  updatePost,
  deletePost,
  publishPost,
  unpublishPost,
  duplicatePost,
  toggleLike,
  toggleBookmark
} from '../controllers/blogPostController.js';

import {
  getAllCategories,
  getCategoryBySlug,
  createCategory,
  updateCategory,
  deleteCategory,
  getCategoryPosts,
  reorderCategories
} from '../controllers/blogCategoryController.js';

import {
  getAllTags,
  getPopularTags,
  getTagBySlug,
  createTag,
  updateTag,
  deleteTag,
  getTagPosts,
  bulkCreateTags
} from '../controllers/blogTagController.js';

import {
  getSitemap,
  getImageSitemap,
  getNewsSitemap,
  getSitemapStatistics,
  getRSSFeed,
  getAtomFeed,
  getJSONFeed,
  getCategoryFeed,
  getFeedStatistics,
  getRobotsTxt,
  getPostSchemas,
  getPostMetaTags,
  getCategoryMetaTags,
  getTagMetaTags,
  getBlogHomeMetaTags,
  validatePostSEOScore,
  getOrganizationSchema,
  getWebSiteSchema,
  getBlogSchema
} from '../controllers/seoController.js';

import {
  getAIMetadata,
  getConversationalFormat,
  getQAFormat,
  getSemanticAnalysis,
  getMarkdownFormat,
  getExtendedJSONLD,
  getLLMMetadata,
  getKeywords,
  getEntities,
  getTopics,
  getReadabilityAnalysis,
  getSentimentAnalysis,
  getStructureAnalysis,
  getImprovementSuggestions,
  getSuggestedTags,
  getSuggestedKeywords,
  getContentScore,
  optimizePost
} from '../controllers/aiSeoController.js';

// Middlewares de autenticación y autorización
import { requireAuth } from '../middleware/clerkAuth.js';
import {
  canViewAllPosts,
  canCreateBlogPosts,
  canEditOwnBlogPosts,
  canDeleteOwnBlogPosts,
  canPublishBlogPosts,
  canDuplicateBlogPosts,
  canManageBlogCategories,
  canManageBlogTags,
  checkPostOwnership
} from '../middleware/blogAuth.js';

const router = express.Router();

// ========================================
// RUTAS DE POSTS
// ========================================

// Rutas admin de posts (deben ir ANTES de las rutas públicas)
router.get('/admin/posts', ...canViewAllPosts, getAllAdminPosts);
router.get('/admin/posts/:id', ...canViewAllPosts, getPostById);

// Rutas públicas de posts
router.get('/posts', getAllPublishedPosts);
router.get('/posts/featured', getFeaturedPosts);
router.get('/posts/popular', getPopularPosts);
router.get('/posts/search', searchPosts);
router.get('/posts/:slug', getPostBySlug);

// Rutas protegidas de posts
router.post('/posts', ...canCreateBlogPosts, createPost);
router.put('/posts/:id', ...canEditOwnBlogPosts, checkPostOwnership, updatePost);
router.delete('/posts/:id', ...canDeleteOwnBlogPosts, checkPostOwnership, deletePost);

// Acciones especiales de posts
router.patch('/posts/:id/publish', ...canPublishBlogPosts, publishPost);
router.patch('/posts/:id/unpublish', ...canPublishBlogPosts, unpublishPost);
router.post('/posts/:id/duplicate', ...canDuplicateBlogPosts, duplicatePost);

// Interacciones de usuario con posts
router.post('/posts/:id/like', requireAuth, toggleLike);
router.post('/posts/:id/bookmark', requireAuth, toggleBookmark);

// ========================================
// RUTAS DE CATEGORÍAS
// ========================================

// Rutas públicas de categorías
router.get('/categories', getAllCategories);
router.get('/categories/:slug', getCategoryBySlug);
router.get('/categories/:slug/posts', getCategoryPosts);

// Rutas protegidas de categorías
router.post('/categories', ...canManageBlogCategories, createCategory);
router.put('/categories/:id', ...canManageBlogCategories, updateCategory);
router.delete('/categories/:id', ...canManageBlogCategories, deleteCategory);
router.put('/categories/reorder', ...canManageBlogCategories, reorderCategories);

// ========================================
// RUTAS DE TAGS
// ========================================

// Rutas públicas de tags
router.get('/tags', getAllTags);
router.get('/tags/popular', getPopularTags);
router.get('/tags/:slug', getTagBySlug);
router.get('/tags/:slug/posts', getTagPosts);

// Rutas protegidas de tags
router.post('/tags', ...canManageBlogTags, createTag);
router.post('/tags/bulk', ...canManageBlogTags, bulkCreateTags);
router.put('/tags/:id', ...canManageBlogTags, updateTag);
router.delete('/tags/:id', ...canManageBlogTags, deleteTag);

// ========================================
// RUTAS DE ESTADÍSTICAS Y ANALYTICS (Futuro)
// ========================================

// TODO: Implementar en Sprint 5
// router.get('/analytics/overview', canViewBlogAnalytics, getAnalyticsOverview);
// router.get('/analytics/posts/:id', canViewBlogAnalytics, getPostAnalytics);
// router.get('/analytics/export', canExportBlogData, exportBlogData);

// ========================================
// RUTAS DE SEO - Sprint 2 ✅
// ========================================

// Sitemaps (públicos para crawlers)
router.get('/sitemap.xml', getSitemap);
router.get('/sitemap-images.xml', getImageSitemap);
router.get('/sitemap-news.xml', getNewsSitemap);
router.get('/sitemap-stats', getSitemapStatistics); // Debug/monitoreo

// RSS/Atom Feeds (públicos para lectores)
router.get('/feed.xml', getRSSFeed);
router.get('/feed.atom', getAtomFeed);
router.get('/feed.json', getJSONFeed);
router.get('/feed/category/:slug', getCategoryFeed);
router.get('/feed-stats', getFeedStatistics); // Debug/monitoreo

// Robots.txt (público para crawlers)
router.get('/robots.txt', getRobotsTxt);

// Schema.org JSON-LD por post
router.get('/schema/:slug', getPostSchemas);

// Meta Tags por contenido
router.get('/meta/:slug', getPostMetaTags);
router.get('/meta/category/:slug', getCategoryMetaTags);
router.get('/meta/tag/:slug', getTagMetaTags);
router.get('/meta/home', getBlogHomeMetaTags);

// Validación SEO (interno/debug)
router.get('/seo-validation/:slug', validatePostSEOScore);

// Schemas generales (reutilizables)
router.get('/schema/organization', getOrganizationSchema);
router.get('/schema/website', getWebSiteSchema);
router.get('/schema/blog', getBlogSchema);

// ========================================
// RUTAS DE AI SEO - Sprint 3 🤖
// ========================================

// Metadata AI y formatos para LLMs (públicos)
router.get('/ai/metadata/:slug', getAIMetadata);
router.get('/ai/conversational/:slug', getConversationalFormat);
router.get('/ai/qa/:slug', getQAFormat);
router.get('/ai/llm-metadata/:slug', getLLMMetadata);
router.get('/ai/markdown/:slug', getMarkdownFormat);
router.get('/ai/json-ld-extended/:slug', getExtendedJSONLD);

// Análisis semántico (públicos)
router.get('/ai/semantic-analysis/:slug', getSemanticAnalysis);
router.get('/ai/keywords/:slug', getKeywords);
router.get('/ai/entities/:slug', getEntities);
router.get('/ai/topics/:slug', getTopics);
router.get('/ai/readability/:slug', getReadabilityAnalysis);
router.get('/ai/sentiment/:slug', getSentimentAnalysis);
router.get('/ai/structure/:slug', getStructureAnalysis);

// Sugerencias y mejoras (requiere autenticación)
router.get('/ai/suggestions/:slug', requireAuth, getImprovementSuggestions);
router.get('/ai/suggest-tags/:slug', requireAuth, getSuggestedTags);
router.get('/ai/suggest-keywords/:slug', requireAuth, getSuggestedKeywords);
router.get('/ai/content-score/:slug', requireAuth, getContentScore);

// Optimización automática (requiere autenticación + permisos de edición)
router.post('/ai/optimize/:slug', requireAuth, canEditOwnBlogPosts, optimizePost);

export default router;
