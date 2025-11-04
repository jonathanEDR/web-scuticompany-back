import BlogPost from '../models/BlogPost.js';
import BlogCategory from '../models/BlogCategory.js';
import BlogTag from '../models/BlogTag.js';
import User from '../models/User.js';
import { generatePostSlug } from '../utils/slugGenerator.js';
import { calculateReadingTime } from '../utils/readingTimeCalculator.js';
import { generatePostMetaTags, validatePostSEO } from '../utils/seoGenerator.js';
import { generateArticleSchema } from '../utils/schemaGenerator.js';

/**
 * @desc    Obtener todos los posts publicados (público)
 * @route   GET /api/blog/posts
 * @access  Public
 */
export const getAllPublishedPosts = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      category,
      tag,
      author,
      featured,
      sortBy = '-publishedAt',
      search
    } = req.query;
    
    const query = { isPublished: true, status: 'published' };
    
    // Filtros opcionales
    if (category) query.category = category;
    if (tag) query.tags = tag;
    if (author) query.author = author;
    if (featured !== undefined) query.isFeatured = featured === 'true';
    
    // Búsqueda por texto
    if (search) {
      query.$text = { $search: search };
    }
    
    let postsQuery = BlogPost.find(query)
      .populate('author', 'firstName lastName email')
      .populate('category', 'name slug color')
      .populate('tags', 'name slug color')
      .sort(sortBy)
      .skip((page - 1) * limit)
      .limit(parseInt(limit));
    
    // Si hay búsqueda, agregar score
    if (search) {
      postsQuery = postsQuery.select({ score: { $meta: 'textScore' } });
    }
    
    const posts = await postsQuery.lean();
    const total = await BlogPost.countDocuments(query);
    
    // ✅ Estructura consistente con getAllAdminPosts
    res.json({
      success: true,
      data: {
        data: posts,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
    
  } catch (error) {
    console.error('Error al obtener posts:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener posts',
      error: error.message
    });
  }
};

/**
 * @desc    Obtener TODOS los posts (incluye borradores) - ADMIN
 * @route   GET /api/blog/admin/posts
 * @access  Private/Admin
 */
export const getAllAdminPosts = async (req, res) => {
  try {
    console.log('📊 [getAllAdminPosts] Llamada recibida');
    console.log('User:', req.user?.email);
    console.log('Query params:', req.query);
    
    const {
      page = 1,
      limit = 10,
      category,
      tag,
      author,
      status,
      isPublished,
      sortBy = '-createdAt',
      search
    } = req.query;
    
    const query = {};
    
    // Filtros opcionales
    if (category) query.category = category;
    if (tag) query.tags = tag;
    if (author) query.author = author;
    if (status) query.status = status;
    if (isPublished !== undefined) query.isPublished = isPublished === 'true';
    
    // Búsqueda por texto
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { excerpt: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } }
      ];
    }
    
    console.log('🔍 Query MongoDB:', query);
    
    const posts = await BlogPost.find(query)
      .populate('author', 'firstName lastName email')
      .populate('category', 'name slug color')
      .populate('tags', 'name slug color')
      .sort(sortBy)
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .lean();
    
    const total = await BlogPost.countDocuments(query);
    
    console.log(`✅ Posts encontrados: ${posts.length} de ${total} total`);
    
    res.json({
      success: true,
      data: {
        data: posts,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
    
  } catch (error) {
    console.error('Error al obtener posts admin:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener posts',
      error: error.message
    });
  }
};

/**
 * @desc    Obtener un post por slug (público)
 * @route   GET /api/blog/posts/:slug
 * @access  Public
 */
export const getPostBySlug = async (req, res) => {
  try {
    const { slug } = req.params;
    const { incrementViews = 'true' } = req.query;
    
    const post = await BlogPost.findOne({ slug, isPublished: true, status: 'published' })
      .populate('author', 'firstName lastName email')
      .populate('category', 'name slug color description')
      .populate('tags', 'name slug color')
      .lean();
    
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post no encontrado'
      });
    }
    
    // Incrementar vistas si se solicita
    if (incrementViews === 'true') {
      await BlogPost.findByIdAndUpdate(post._id, { $inc: { 'analytics.views': 1 } });
    }
    
    // Obtener posts relacionados
    const relatedPosts = await BlogPost.getRelatedPosts(post._id, 3);
    
    res.json({
      success: true,
      data: {
        post,
        relatedPosts
      }
    });
    
  } catch (error) {
    console.error('Error al obtener post:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener post',
      error: error.message
    });
  }
};

/**
 * @desc    Obtener un post por ID (admin) - incluye borradores
 * @route   GET /api/blog/admin/posts/:id
 * @access  Private/Admin
 */
export const getPostById = async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log('📝 [getPostById] ID:', id);
    
    const post = await BlogPost.findById(id)
      .populate('author', 'firstName lastName email')
      .populate('category', 'name slug color description')
      .populate('tags', 'name slug color')
      .lean();
    
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post no encontrado'
      });
    }
    
    console.log('✅ [getPostById] Post encontrado:', post.title);
    
    res.json({
      success: true,
      data: post
    });
    
  } catch (error) {
    console.error('Error al obtener post por ID:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener el post',
      error: error.message
    });
  }
};

/**
 * @desc    Obtener posts destacados (público)
 * @route   GET /api/blog/posts/featured
 * @access  Public
 */
export const getFeaturedPosts = async (req, res) => {
  try {
    const { limit = 5 } = req.query;
    
    const posts = await BlogPost.find({
      isPublished: true,
      status: 'published',
      isFeatured: true
    })
      .populate('author', 'firstName lastName')
      .populate('category', 'name slug color')
      .populate('tags', 'name slug color')
      .sort('-publishedAt')
      .limit(parseInt(limit))
      .lean();
    
    res.json({
      success: true,
      data: posts,
      count: posts.length
    });
    
  } catch (error) {
    console.error('Error al obtener posts destacados:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener posts destacados',
      error: error.message
    });
  }
};

/**
 * @desc    Obtener posts populares
 * @route   GET /api/blog/posts/popular
 * @access  Public
 */
export const getPopularPosts = async (req, res) => {
  try {
    const { limit = 5, days = 30 } = req.query;
    
    const posts = await BlogPost.getPopularPosts(parseInt(limit), parseInt(days));
    
    res.json({
      success: true,
      data: posts,
      count: posts.length
    });
    
  } catch (error) {
    console.error('Error al obtener posts populares:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener posts populares',
      error: error.message
    });
  }
};

/**
 * @desc    Buscar posts por texto
 * @route   GET /api/blog/posts/search
 * @access  Public
 */
export const searchPosts = async (req, res) => {
  try {
    const { q: searchTerm, page = 1, limit = 10 } = req.query;
    
    if (!searchTerm) {
      return res.status(400).json({
        success: false,
        message: 'El parámetro de búsqueda "q" es requerido'
      });
    }
    
    const result = await BlogPost.searchPosts(searchTerm, { page, limit });
    
    res.json({
      success: true,
      data: result.posts,
      pagination: result.pagination,
      searchTerm
    });
    
  } catch (error) {
    console.error('Error al buscar posts:', error);
    res.status(500).json({
      success: false,
      message: 'Error al buscar posts',
      error: error.message
    });
  }
};

/**
 * @desc    Crear nuevo post
 * @route   POST /api/blog/posts
 * @access  Private (CREATE_BLOG_POSTS)
 */
export const createPost = async (req, res) => {
  try {
    const {
      title,
      excerpt,
      content,
      contentFormat,
      featuredImage,
      category,
      tags,
      status,
      isPublished,
      scheduledPublishAt,
      seo,
      aiOptimization,
      isFeatured,
      allowComments,
      isPinned
    } = req.body;
    
    console.log('📝 [createPost] Datos recibidos:', { 
      title, 
      isPublished, 
      status, 
      category,
      tagsCount: tags?.length 
    });
    
    // Validaciones
    if (!title || !excerpt || !content || !category) {
      return res.status(400).json({
        success: false,
        message: 'Título, extracto, contenido y categoría son requeridos'
      });
    }
    
    // Obtener autor del usuario autenticado
    const userId = req.auth.userId;
    const user = await User.findOne({ clerkId: userId });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }
    
    // Verificar que la categoría existe
    const categoryExists = await BlogCategory.findById(category);
    if (!categoryExists) {
      return res.status(404).json({
        success: false,
        message: 'Categoría no encontrada'
      });
    }
    
    // Procesar tags: crear automáticamente si son strings
    let processedTags = [];
    if (tags && tags.length > 0) {
      for (const tag of tags) {
        // Si el tag es un ObjectId válido, verificar que existe
        if (tag.match(/^[0-9a-fA-F]{24}$/)) {
          const existingTag = await BlogTag.findById(tag);
          if (existingTag) {
            processedTags.push(tag);
          }
        } else {
          // Si es un string, crear el tag automáticamente
          const tagSlug = tag.toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '');
          
          // Buscar si ya existe un tag con ese nombre o slug
          let existingTag = await BlogTag.findOne({ 
            $or: [
              { name: tag },
              { slug: tagSlug }
            ]
          });
          
          // Si no existe, crearlo
          if (!existingTag) {
            existingTag = await BlogTag.create({
              name: tag,
              slug: tagSlug,
              description: `Tag: ${tag}`
            });
            console.log(`✅ Tag creado automáticamente: ${tag}`);
          }
          
          processedTags.push(existingTag._id);
        }
      }
    }
    
    // Generar slug único
    const slug = await generatePostSlug(title);
    
    // Calcular tiempo de lectura
    const readingTime = calculateReadingTime(content, contentFormat || 'html');
    
    // 🎯 AUTO-GENERAR SEO SI NO SE PROPORCIONA
    let finalSeo = seo;
    if (!seo || !seo.metaTitle || !seo.metaDescription) {
      const tempPost = {
        title,
        excerpt,
        content,
        slug,
        tags: processedTags || [],
        author: { firstName: user.firstName, lastName: user.lastName }
      };
      
      const generatedMetaTags = await generatePostMetaTags(tempPost, 'https://web-scuti.com');
      
      finalSeo = {
        metaTitle: seo?.metaTitle || generatedMetaTags.title,
        metaDescription: seo?.metaDescription || generatedMetaTags.description,
        focusKeyphrase: seo?.focusKeyphrase || tags?.[0] || '',
        canonicalUrl: seo?.canonicalUrl || `https://web-scuti.com/blog/${slug}`,
        ogTitle: seo?.ogTitle || generatedMetaTags.openGraph.title,
        ogDescription: seo?.ogDescription || generatedMetaTags.openGraph.description,
        ogImage: seo?.ogImage || featuredImage?.url,
        twitterCard: seo?.twitterCard || generatedMetaTags.twitter.card,
        twitterTitle: seo?.twitterTitle || generatedMetaTags.twitter.title,
        twitterDescription: seo?.twitterDescription || generatedMetaTags.twitter.description,
        twitterImage: seo?.twitterImage || featuredImage?.url
      };
    }
    
    // ✅ Procesar featuredImage correctamente
    let processedFeaturedImage = null;
    if (featuredImage) {
      if (typeof featuredImage === 'string' && featuredImage.trim() !== '') {
        processedFeaturedImage = {
          url: featuredImage,
          alt: title || 'Imagen destacada'
        };
      } else if (typeof featuredImage === 'object' && featuredImage.url) {
        processedFeaturedImage = featuredImage;
      }
    }
    
    // Crear post
    const post = await BlogPost.create({
      title,
      slug,
      excerpt,
      content,
      contentFormat: contentFormat || 'html',
      featuredImage: processedFeaturedImage,
      author: user._id,
      category,
      tags: processedTags,
      status: isPublished ? 'published' : (status || 'draft'),
      isPublished: isPublished || false,
      publishedAt: isPublished ? new Date() : null,
      scheduledPublishAt,
      seo: finalSeo,
      aiOptimization,
      readingTime,
      isFeatured: isFeatured || false,
      isPinned: isPinned || false,
      allowComments: allowComments !== undefined ? allowComments : true
    });
    
    console.log('✅ [createPost] Post creado:', { 
      _id: post._id, 
      title: post.title, 
      isPublished: post.isPublished,
      status: post.status 
    });
    
    // Si se crea como publicado, actualizar contadores
    if (post.status === 'published') {
      await post.publish();
    }
    
    // Popular para respuesta
    await post.populate('author', 'firstName lastName email');
    await post.populate('category', 'name slug color');
    await post.populate('tags', 'name slug color');
    
    res.status(201).json({
      success: true,
      message: 'Post creado exitosamente',
      data: post
    });
    
  } catch (error) {
    console.error('Error al crear post:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear post',
      error: error.message
    });
  }
};

/**
 * @desc    Actualizar post
 * @route   PUT /api/blog/posts/:id
 * @access  Private (EDIT_OWN_BLOG_POSTS o EDIT_ALL_BLOG_POSTS)
 */
export const updatePost = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      excerpt,
      content,
      contentFormat,
      featuredImage,
      category,
      tags,
      status,
      isPublished,
      scheduledPublishAt,
      seo,
      aiOptimization,
      isFeatured,
      allowComments,
      isPinned
    } = req.body;
    
    console.log('📝 [updatePost] Actualizando post:', id);
    console.log('Datos recibidos:', { title, isPublished, status });
    
    const post = await BlogPost.findById(id);
    
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post no encontrado'
      });
    }
    
    // Verificar permisos de edición (se hace en middleware checkPostOwnership)
    
    // Si cambió el título, regenerar slug
    if (title && title !== post.title) {
      post.slug = await generatePostSlug(title, id);
      post.title = title;
    }
    
    // Actualizar contenido y recalcular tiempo de lectura si cambió
    if (content && content !== post.content) {
      post.content = content;
      post.contentFormat = contentFormat || post.contentFormat;
      post.readingTime = calculateReadingTime(content, post.contentFormat);
    }
    
    // Verificar categoría si cambió
    if (category && category !== post.category.toString()) {
      const categoryExists = await BlogCategory.findById(category);
      if (!categoryExists) {
        return res.status(404).json({
          success: false,
          message: 'Categoría no encontrada'
        });
      }
      
      // Actualizar contadores si el post está publicado
      if (post.isPublished) {
        await BlogCategory.findByIdAndUpdate(post.category, { $inc: { postCount: -1 } });
        await BlogCategory.findByIdAndUpdate(category, { $inc: { postCount: 1 } });
      }
      
      post.category = category;
    }
    
    // Verificar tags si cambiaron
    if (tags !== undefined) {
      console.log('📝 [updatePost] Procesando tags:', tags);
      
      // ✅ PROCESAR TAGS: Crear automáticamente si son strings
      let processedTags = [];
      if (tags && tags.length > 0) {
        for (const tag of tags) {
          // Si el tag es un ObjectId válido, verificar que existe
          if (typeof tag === 'string' && tag.match(/^[0-9a-fA-F]{24}$/)) {
            const existingTag = await BlogTag.findById(tag);
            if (existingTag) {
              processedTags.push(tag);
            }
          } else if (typeof tag === 'string') {
            // Si es un string (nombre de tag), crear el tag automáticamente
            const tagSlug = tag.toLowerCase()
              .normalize('NFD')
              .replace(/[\u0300-\u036f]/g, '')
              .replace(/[^a-z0-9]+/g, '-')
              .replace(/^-+|-+$/g, '');
            
            // Buscar si ya existe un tag con ese nombre o slug
            let existingTag = await BlogTag.findOne({ 
              $or: [
                { name: tag },
                { slug: tagSlug }
              ]
            });
            
            // Si no existe, crearlo
            if (!existingTag) {
              existingTag = await BlogTag.create({
                name: tag,
                slug: tagSlug,
                description: `Tag: ${tag}`
              });
              console.log(`✅ [updatePost] Tag creado automáticamente: ${tag}`);
            }
            
            processedTags.push(existingTag._id);
          }
        }
      }
      
      console.log('✅ [updatePost] Tags procesados:', processedTags);
      
      const oldTags = post.tags.map(t => t.toString());
      const newTags = processedTags;
      
      // Actualizar contadores solo si está publicado
      if (post.isPublished) {
        const tagsToRemove = oldTags.filter(t => !newTags.includes(t));
        const tagsToAdd = newTags.filter(t => !oldTags.includes(t));
        
        if (tagsToRemove.length > 0) {
          await BlogTag.updateMany(
            { _id: { $in: tagsToRemove } },
            { $inc: { usageCount: -1 } }
          );
        }
        
        if (tagsToAdd.length > 0) {
          await BlogTag.updateMany(
            { _id: { $in: tagsToAdd } },
            { $inc: { usageCount: 1 } }
          );
        }
      }
      
      post.tags = newTags;
    }
    
    // Actualizar otros campos
    if (excerpt !== undefined) post.excerpt = excerpt;
    
    // ✅ Manejar featuredImage correctamente
    if (featuredImage !== undefined) {
      if (typeof featuredImage === 'string') {
        // Si es un string vacío, establecer como null
        if (featuredImage === '' || !featuredImage) {
          post.featuredImage = null;
        } else {
          // Si es una URL, convertir a objeto
          post.featuredImage = {
            url: featuredImage,
            alt: post.title || 'Imagen destacada'
          };
        }
      } else if (featuredImage && typeof featuredImage === 'object') {
        // Si ya es un objeto, usarlo directamente
        post.featuredImage = featuredImage;
      } else {
        post.featuredImage = null;
      }
    }
    
    if (status !== undefined) post.status = status;
    if (scheduledPublishAt !== undefined) post.scheduledPublishAt = scheduledPublishAt;
    
    // ✅ Actualizar estado de publicación
    if (isPublished !== undefined) {
      const wasPublished = post.isPublished;
      post.isPublished = isPublished;
      
      // Si se está publicando por primera vez
      if (isPublished && !wasPublished) {
        post.status = 'published';
        post.publishedAt = new Date();
        console.log('✅ [updatePost] Post siendo publicado por primera vez');
      }
      
      // Si se está despublicando
      if (!isPublished && wasPublished) {
        post.status = 'draft';
        console.log('✅ [updatePost] Post siendo despublicado');
      }
    }
    
    // ✅ Actualizar isPinned
    if (isPinned !== undefined) post.isPinned = isPinned;
    
    // 🎯 AUTO-ACTUALIZAR SEO SI CAMBIARON CAMPOS RELEVANTES
    if (seo !== undefined || title || excerpt || content) {
      const shouldRegenerateSEO = (
        !post.seo?.metaTitle || 
        !post.seo?.metaDescription || 
        (seo && Object.keys(seo).length > 0)
      );
      
      if (shouldRegenerateSEO) {
        await post.populate('author', 'firstName lastName');
        await post.populate('tags', 'name');
        
        const generatedMetaTags = await generatePostMetaTags(post.toObject(), 'https://web-scuti.com');
        
        post.seo = {
          ...post.seo,
          metaTitle: seo?.metaTitle || post.seo?.metaTitle || generatedMetaTags.title,
          metaDescription: seo?.metaDescription || post.seo?.metaDescription || generatedMetaTags.description,
          focusKeyphrase: seo?.focusKeyphrase || post.seo?.focusKeyphrase || post.tags?.[0]?.name || '',
          canonicalUrl: seo?.canonicalUrl || post.seo?.canonicalUrl || `https://web-scuti.com/blog/${post.slug}`,
          ogTitle: seo?.ogTitle || post.seo?.ogTitle || generatedMetaTags.openGraph.title,
          ogDescription: seo?.ogDescription || post.seo?.ogDescription || generatedMetaTags.openGraph.description,
          ogImage: seo?.ogImage || post.seo?.ogImage || post.featuredImage?.url,
          twitterCard: seo?.twitterCard || post.seo?.twitterCard || generatedMetaTags.twitter.card,
          twitterTitle: seo?.twitterTitle || post.seo?.twitterTitle || generatedMetaTags.twitter.title,
          twitterDescription: seo?.twitterDescription || post.seo?.twitterDescription || generatedMetaTags.twitter.description,
          twitterImage: seo?.twitterImage || post.seo?.twitterImage || post.featuredImage?.url,
          ...seo
        };
      }
    }
    
    if (aiOptimization !== undefined) post.aiOptimization = { ...post.aiOptimization, ...aiOptimization };
    if (isFeatured !== undefined) post.isFeatured = isFeatured;
    if (allowComments !== undefined) post.allowComments = allowComments;
    
    await post.save();
    
    console.log('✅ [updatePost] Post actualizado exitosamente:', { 
      _id: post._id, 
      title: post.title,
      isPublished: post.isPublished,
      status: post.status
    });
    
    // Popular para respuesta
    await post.populate('author', 'firstName lastName email');
    await post.populate('category', 'name slug color');
    await post.populate('tags', 'name slug color');
    
    res.json({
      success: true,
      message: 'Post actualizado exitosamente',
      data: post
    });
    
  } catch (error) {
    console.error('Error al actualizar post:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar post',
      error: error.message
    });
  }
};

/**
 * @desc    Eliminar post
 * @route   DELETE /api/blog/posts/:id
 * @access  Private (DELETE_OWN_BLOG_POSTS o DELETE_BLOG_POSTS)
 */
export const deletePost = async (req, res) => {
  try {
    const { id } = req.params;
    
    const post = await BlogPost.findById(id);
    
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post no encontrado'
      });
    }
    
    // Actualizar contadores si estaba publicado
    if (post.isPublished) {
      await BlogCategory.findByIdAndUpdate(post.category, { $inc: { postCount: -1 } });
      
      if (post.tags && post.tags.length > 0) {
        await BlogTag.updateMany(
          { _id: { $in: post.tags } },
          { $inc: { usageCount: -1 } }
        );
      }
    }
    
    await post.deleteOne();
    
    res.json({
      success: true,
      message: 'Post eliminado exitosamente'
    });
    
  } catch (error) {
    console.error('Error al eliminar post:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar post',
      error: error.message
    });
  }
};

/**
 * @desc    Publicar post
 * @route   PATCH /api/blog/posts/:id/publish
 * @access  Private (PUBLISH_BLOG_POSTS)
 */
export const publishPost = async (req, res) => {
  try {
    const { id } = req.params;
    
    const post = await BlogPost.findById(id);
    
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post no encontrado'
      });
    }
    
    if (post.isPublished) {
      return res.status(400).json({
        success: false,
        message: 'El post ya está publicado'
      });
    }
    
    await post.publish();
    await post.populate('author', 'firstName lastName email');
    await post.populate('category', 'name slug color');
    await post.populate('tags', 'name slug color');
    
    res.json({
      success: true,
      message: 'Post publicado exitosamente',
      data: post
    });
    
  } catch (error) {
    console.error('Error al publicar post:', error);
    res.status(500).json({
      success: false,
      message: 'Error al publicar post',
      error: error.message
    });
  }
};

/**
 * @desc    Despublicar post
 * @route   PATCH /api/blog/posts/:id/unpublish
 * @access  Private (PUBLISH_BLOG_POSTS)
 */
export const unpublishPost = async (req, res) => {
  try {
    const { id } = req.params;
    
    const post = await BlogPost.findById(id);
    
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post no encontrado'
      });
    }
    
    if (!post.isPublished) {
      return res.status(400).json({
        success: false,
        message: 'El post no está publicado'
      });
    }
    
    await post.unpublish();
    await post.populate('author', 'firstName lastName email');
    await post.populate('category', 'name slug color');
    await post.populate('tags', 'name slug color');
    
    res.json({
      success: true,
      message: 'Post despublicado exitosamente',
      data: post
    });
    
  } catch (error) {
    console.error('Error al despublicar post:', error);
    res.status(500).json({
      success: false,
      message: 'Error al despublicar post',
      error: error.message
    });
  }
};

/**
 * @desc    Duplicar post
 * @route   POST /api/blog/posts/:id/duplicate
 * @access  Private (DUPLICATE_BLOG_POSTS)
 */
export const duplicatePost = async (req, res) => {
  try {
    const { id } = req.params;
    
    const originalPost = await BlogPost.findById(id);
    
    if (!originalPost) {
      return res.status(404).json({
        success: false,
        message: 'Post no encontrado'
      });
    }
    
    // Obtener usuario actual
    const userId = req.auth.userId;
    const user = await User.findOne({ clerkId: userId });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }
    
    // Crear copia
    const postData = originalPost.toObject();
    delete postData._id;
    delete postData.createdAt;
    delete postData.updatedAt;
    delete postData.publishedAt;
    
    // Modificar datos para la copia
    postData.title = `${postData.title} (Copia)`;
    postData.slug = await generatePostSlug(postData.title);
    postData.author = user._id;
    postData.status = 'draft';
    postData.isPublished = false;
    postData.isFeatured = false;
    postData.analytics = {
      views: 0,
      uniqueVisitors: 0,
      likes: 0,
      shares: { facebook: 0, twitter: 0, linkedin: 0, whatsapp: 0 },
      avgTimeOnPage: 0,
      bounceRate: 0
    };
    postData.likedBy = [];
    postData.bookmarkedBy = [];
    
    const duplicatedPost = await BlogPost.create(postData);
    
    await duplicatedPost.populate('author', 'firstName lastName email');
    await duplicatedPost.populate('category', 'name slug color');
    await duplicatedPost.populate('tags', 'name slug color');
    
    res.status(201).json({
      success: true,
      message: 'Post duplicado exitosamente',
      data: duplicatedPost
    });
    
  } catch (error) {
    console.error('Error al duplicar post:', error);
    res.status(500).json({
      success: false,
      message: 'Error al duplicar post',
      error: error.message
    });
  }
};

/**
 * @desc    Dar/quitar like a un post
 * @route   POST /api/blog/posts/:id/like
 * @access  Private (Usuario autenticado)
 */
export const toggleLike = async (req, res) => {
  try {
    const { id } = req.params;
    
    const post = await BlogPost.findById(id);
    
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post no encontrado'
      });
    }
    
    const userId = req.auth.userId;
    const user = await User.findOne({ clerkId: userId });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }
    
    const liked = await post.toggleLike(user._id);
    
    res.json({
      success: true,
      message: liked ? 'Like agregado' : 'Like removido',
      data: {
        liked,
        likes: post.analytics.likes
      }
    });
    
  } catch (error) {
    console.error('Error al dar like:', error);
    res.status(500).json({
      success: false,
      message: 'Error al procesar like',
      error: error.message
    });
  }
};

/**
 * @desc    Guardar/quitar bookmark de un post
 * @route   POST /api/blog/posts/:id/bookmark
 * @access  Private (Usuario autenticado)
 */
export const toggleBookmark = async (req, res) => {
  try {
    const { id } = req.params;
    
    const post = await BlogPost.findById(id);
    
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post no encontrado'
      });
    }
    
    const userId = req.auth.userId;
    const user = await User.findOne({ clerkId: userId });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }
    
    const bookmarked = await post.toggleBookmark(user._id);
    
    res.json({
      success: true,
      message: bookmarked ? 'Post guardado' : 'Post removido de guardados',
      data: {
        bookmarked
      }
    });
    
  } catch (error) {
    console.error('Error al guardar post:', error);
    res.status(500).json({
      success: false,
      message: 'Error al procesar bookmark',
      error: error.message
    });
  }
};

export default {
  getAllPublishedPosts,
  getPostBySlug,
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
};
