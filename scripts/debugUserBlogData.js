/**
 * 🔍 Debug Script - Verificar datos de usuario y posts
 */

import mongoose from 'mongoose';
import User from '../models/User.js';
import BlogPost from '../models/BlogPost.js';
import BlogComment from '../models/BlogComment.js';
import dotenv from 'dotenv';

dotenv.config();

async function debugUserData() {
  try {
    // Conectar a MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/web-scuti');
    console.log('✅ Conectado a MongoDB\n');

    // Buscar el usuario actual (ajusta el email según tu usuario de prueba)
    const user = await User.findOne({ email: 'sersi.asistent@gmail.com' });
    
    if (!user) {
      console.log('❌ Usuario no encontrado');
      process.exit(1);
    }

    console.log('👤 USUARIO ENCONTRADO:');
    console.log('   clerkId:', user.clerkId);
    console.log('   _id:', user._id);
    console.log('   email:', user.email);
    console.log('   nombre:', `${user.firstName} ${user.lastName}`);
    console.log('');

    // Buscar comentarios del usuario
    const comments = await BlogComment.find({ 'author.userId': user._id });
    console.log(`💬 COMENTARIOS: ${comments.length} total`);
    comments.forEach((comment, i) => {
      console.log(`   ${i + 1}. Post: ${comment.post}, Status: ${comment.status}`);
    });
    console.log('');

    // Buscar posts con like del usuario
    const likedPosts = await BlogPost.find({ likedBy: user._id });
    console.log(`❤️  POSTS CON LIKE: ${likedPosts.length} total`);
    likedPosts.forEach((post, i) => {
      console.log(`   ${i + 1}. ${post.title} (${post.slug})`);
      console.log(`      likedBy array:`, post.likedBy.map(id => id.toString()));
    });
    console.log('');

    // Buscar posts guardados
    const bookmarkedPosts = await BlogPost.find({ bookmarkedBy: user._id });
    console.log(`🔖 POSTS GUARDADOS: ${bookmarkedPosts.length} total`);
    bookmarkedPosts.forEach((post, i) => {
      console.log(`   ${i + 1}. ${post.title} (${post.slug})`);
      console.log(`      bookmarkedBy array:`, post.bookmarkedBy.map(id => id.toString()));
    });
    console.log('');

    // Verificar el post donde el usuario comentó
    const userComment = await BlogComment.findOne({ 'author.userId': user._id });
    if (userComment) {
      const testPost = await BlogPost.findById(userComment.post);
      if (testPost) {
        console.log('📄 POST DONDE COMENTASTE:');
        console.log('   _id:', testPost._id);
        console.log('   Título:', testPost.title);
        console.log('   Slug:', testPost.slug);
        console.log('   likedBy:', testPost.likedBy);
        console.log('   bookmarkedBy:', testPost.bookmarkedBy);
        console.log('   likedBy count:', testPost.likedBy.length);
        console.log('   bookmarkedBy count:', testPost.bookmarkedBy.length);
        console.log('   ¿Usuario tiene like?', testPost.likedBy.some(id => id.toString() === user._id.toString()));
        console.log('   ¿Usuario tiene bookmark?', testPost.bookmarkedBy.some(id => id.toString() === user._id.toString()));
      }
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n✅ Conexión cerrada');
  }
}

debugUserData();
