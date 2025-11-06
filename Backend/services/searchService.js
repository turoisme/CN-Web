const Movie = require('../models/Movie');
const Actor = require('../models/Actor');
const Director = require('../models/Director');
const Genre = require('../models/Genre');

/**
 * Advanced movie search
 * @param {Object} searchParams - Search parameters
 * @returns {Object} - Search results with pagination
 */
const advancedSearch = async (searchParams) => {
  try {
    const {
      query = '',
      genres = [],
      actors = [],
      directors = [],
      yearFrom,
      yearTo,
      ratingFrom,
      ratingTo,
      country,
      language,
      page = 1,
      limit = 20,
      sort = '-averageRating'
    } = searchParams;

    // Build filter object
    const filter = { isActive: true };

    // Text search
    if (query) {
      filter.$text = { $search: query };
    }

    // Genre filter
    if (genres.length > 0) {
      filter.genres = { $in: genres };
    }

    // Actors filter
    if (actors.length > 0) {
      filter.actors = { $in: actors };
    }

    // Directors filter
    if (directors.length > 0) {
      filter.directors = { $in: directors };
    }

    // Year range
    if (yearFrom || yearTo) {
      filter.releaseYear = {};
      if (yearFrom) filter.releaseYear.$gte = parseInt(yearFrom);
      if (yearTo) filter.releaseYear.$lte = parseInt(yearTo);
    }

    // Rating range
    if (ratingFrom || ratingTo) {
      filter.averageRating = {};
      if (ratingFrom) filter.averageRating.$gte = parseFloat(ratingFrom);
      if (ratingTo) filter.averageRating.$lte = parseFloat(ratingTo);
    }

    // Country filter
    if (country) {
      filter.country = new RegExp(country, 'i');
    }

    // Language filter
    if (language) {
      filter.language = new RegExp(language, 'i');
    }

    // Get total count
    const total = await Movie.countDocuments(filter);

    // Get movies
    const movies = await Movie.find(filter)
      .populate('genres', 'name slug')
      .populate('actors', 'name')
      .populate('directors', 'name')
      .sort(sort)
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit))
      .select('-__v');

    return {
      movies,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    };
  } catch (error) {
    throw new Error(`Search error: ${error.message}`);
  }
};

/**
 * Search by actor name
 * @param {String} actorName - Actor name
 * @returns {Array} - Movies featuring the actor
 */
const searchByActor = async (actorName) => {
  try {
    // Find actors matching the name
    const actors = await Actor.find({
      name: new RegExp(actorName, 'i')
    });

    if (actors.length === 0) {
      return [];
    }

    const actorIds = actors.map(a => a._id);

    // Find movies with these actors
    const movies = await Movie.find({
      actors: { $in: actorIds },
      isActive: true
    })
      .populate('genres', 'name')
      .populate('actors', 'name')
      .populate('directors', 'name')
      .sort('-averageRating')
      .limit(20);

    return movies;
  } catch (error) {
    throw new Error(`Actor search error: ${error.message}`);
  }
};

/**
 * Search by director name
 * @param {String} directorName - Director name
 * @returns {Array} - Movies by the director
 */
const searchByDirector = async (directorName) => {
  try {
    // Find directors matching the name
    const directors = await Director.find({
      name: new RegExp(directorName, 'i')
    });

    if (directors.length === 0) {
      return [];
    }

    const directorIds = directors.map(d => d._id);

    // Find movies by these directors
    const movies = await Movie.find({
      directors: { $in: directorIds },
      isActive: true
    })
      .populate('genres', 'name')
      .populate('actors', 'name')
      .populate('directors', 'name')
      .sort('-averageRating')
      .limit(20);

    return movies;
  } catch (error) {
    throw new Error(`Director search error: ${error.message}`);
  }
};

/**
 * Get autocomplete suggestions
 * @param {String} query - Search query
 * @returns {Object} - Suggestions
 */
const getAutocompleteSuggestions = async (query) => {
  try {
    const regex = new RegExp(query, 'i');

    // Get movie suggestions
    const movies = await Movie.find({
      title: regex,
      isActive: true
    })
      .select('title posterUrl releaseYear')
      .limit(5);

    // Get actor suggestions
    const actors = await Actor.find({
      name: regex
    })
      .select('name photoUrl')
      .limit(5);

    // Get director suggestions
    const directors = await Director.find({
      name: regex
    })
      .select('name photoUrl')
      .limit(5);

    // Get genre suggestions
    const genres = await Genre.find({
      name: regex
    })
      .select('name slug')
      .limit(5);

    return {
      movies,
      actors,
      directors,
      genres
    };
  } catch (error) {
    throw new Error(`Autocomplete error: ${error.message}`);
  }
};

/**
 * Get filter options (genres, years, etc.)
 * @returns {Object} - Available filter options
 */
const getFilterOptions = async () => {
  try {
    // Get all genres
    const genres = await Genre.find().select('name slug').sort('name');

    // Get year range
    const yearStats = await Movie.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: null,
          minYear: { $min: '$releaseYear' },
          maxYear: { $max: '$releaseYear' }
        }
      }
    ]);

    // Get countries
    const countries = await Movie.distinct('country', { isActive: true });

    // Get languages
    const languages = await Movie.distinct('language', { isActive: true });

    return {
      genres,
      yearRange: yearStats[0] || { minYear: 1900, maxYear: new Date().getFullYear() },
      countries: countries.sort(),
      languages: languages.sort()
    };
  } catch (error) {
    throw new Error(`Get filter options error: ${error.message}`);
  }
};

module.exports = {
  advancedSearch,
  searchByActor,
  searchByDirector,
  getAutocompleteSuggestions,
  getFilterOptions
};