import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Clearing old data...');
  await prisma.recipe.deleteMany({});
  await prisma.user.deleteMany({});

  // 1) Créer l'utilisateur seed
  const passwordHash = await bcrypt.hash('password123', 10);
  const seedUser = await prisma.user.create({
    data: {
      email: 'seed@recipes.com',
      name: 'Seed User',
      passwordHash,
    },
  });
  console.log('✅ Seed user ID:', seedUser.id);

  // 2) Données des recettes
  const recipesData = [
    {
      title: 'Turkey Sloppy Joes',
      imageUrl: '/images/poulet.jpg',
      activeTime: '20 min',
      totalTime: '45 min',
      yield: '4 servings',
      steps: [
        'Brown the turkey in a skillet.',
        'Add sauce ingredients and simmer.',
        'Toast the buns.',
        'Assemble sloppy joes.',
        'Serve hot.'
      ],
      ingredients: [
        '500g ground turkey',
        '1 onion, chopped',
        '1 bell pepper, diced',
        '2 tbsp tomato paste',
        '4 hamburger buns'
      ],
    },
    {
      title: 'Brown Sugar Meatloaf',
      imageUrl: '/images/photo2.jpg',
      activeTime: '30 min',
      totalTime: '1 hr 10 min',
      yield: '6 servings',
      steps: [
        'Preheat the oven to 175°C.',
        'Mix ground beef with seasonings.',
        'Shape into a loaf.',
        'Glaze with brown sugar mix.',
        'Bake until cooked through.'
      ],
      ingredients: [
        '500g ground beef',
        '1 cup breadcrumbs',
        '1 egg',
        '1/2 cup brown sugar',
        '2 tbsp ketchup'
      ],
    },
    {
      title: 'Awesome Slow Cooker Pot Roast',
      imageUrl: '/images/photo3.jpg',
      activeTime: '15 min',
      totalTime: '8 hr',
      yield: '8 servings',
      steps: [
        'Season the roast generously.',
        'Sear in a hot pan.',
        'Place in slow cooker with veggies.',
        'Add broth and seasonings.',
        'Cook on low for 8 hours.'
      ],
      ingredients: [
        '1.5kg beef roast',
        '4 carrots, chopped',
        '3 potatoes, diced',
        '2 cups beef broth',
        '1 onion, sliced'
      ],
    },
    {
      title: 'Broiled Tilapia Parmesan',
      imageUrl: '/images/photo4.jpg',
      activeTime: '10 min',
      totalTime: '25 min',
      yield: '2 servings',
      steps: [
        'Preheat the broiler.',
        'Mix Parmesan topping.',
        'Place tilapia on baking sheet.',
        'Spread topping evenly.',
        'Broil until golden.'
      ],
      ingredients: [
        '2 tilapia fillets',
        '1/4 cup grated Parmesan',
        '2 tbsp mayonnaise',
        '1 tsp lemon juice',
        'Salt and pepper'
      ],
    },
    {
      title: 'Baked Teriyaki Chicken',
      imageUrl: '/images/photo5.jpg',
      activeTime: '15 min',
      totalTime: '1 hr',
      yield: '5 servings',
      steps: [
        'Make teriyaki sauce.',
        'Marinate chicken.',
        'Preheat oven to 190°C.',
        'Place chicken in baking dish.',
        'Bake for 45 minutes.'
      ],
      ingredients: [
        '1kg chicken thighs',
        '1/2 cup soy sauce',
        '1/4 cup honey',
        '2 cloves garlic, minced',
        '1 tsp ginger, grated'
      ],
    },
    {
      title: 'Zesty Slow Cooker Chicken',
      imageUrl: '/images/photo6.jpg',
      activeTime: '20 min',
      totalTime: '6 hr',
      yield: '6 servings',
      steps: [
        'Season the chicken.',
        'Place in slow cooker.',
        'Add salsa and spices.',
        'Cook on low for 6 hours.',
        'Shred and serve.'
      ],
      ingredients: [
        '1kg chicken breasts',
        '2 cups salsa',
        '1 tsp cumin',
        '1 tsp chili powder',
        'Salt to taste'
      ],
    },
    {
      title: 'Rosemary Ranch Chicken Kabobs',
      imageUrl: '/images/photo7.jpg',
      activeTime: '25 min',
      totalTime: '50 min',
      yield: '4 servings',
      steps: [
        'Cut chicken into cubes.',
        'Marinate with ranch and rosemary.',
        'Skewer the chicken.',
        'Grill on medium heat.',
        'Serve with dipping sauce.'
      ],
      ingredients: [
        '600g chicken breasts',
        '1/2 cup ranch dressing',
        '2 tbsp fresh rosemary',
        'Wooden skewers',
        'Salt and pepper'
      ],
    },
    {
      title: 'Slow Cooker Pulled Pork',
      imageUrl: '/images/photo8.jpg',
      activeTime: '15 min',
      totalTime: '7 hr',
      yield: '8 servings',
      steps: [
        'Rub pork with spices.',
        'Place in slow cooker.',
        'Add BBQ sauce.',
        'Cook on low for 7 hours.',
        'Shred and serve on buns.'
      ],
      ingredients: [
        '1.5kg pork shoulder',
        '1 cup BBQ sauce',
        '2 tbsp brown sugar',
        '1 tsp paprika',
        '8 hamburger buns'
      ],
    },
    {
      title: 'Greek Lemon Chicken and Potatoes',
      imageUrl: '/images/photo9.jpg',
      activeTime: '30 min',
      totalTime: '1 hr 30 min',
      yield: '5 servings',
      steps: [
        'Preheat oven to 200°C.',
        'Mix marinade ingredients.',
        'Toss chicken and potatoes.',
        'Bake in a roasting pan.',
        'Serve with lemon wedges.'
      ],
      ingredients: [
        '1kg chicken thighs',
        '4 potatoes, quartered',
        '1/4 cup olive oil',
        'Juice of 2 lemons',
        '1 tbsp oregano'
      ],
    },
    {
      title: 'Mexican Chicken & Cheese',
      imageUrl: '/images/photo10.jpg',
      activeTime: '20 min',
      totalTime: '1 hr',
      yield: '4 servings',
      steps: [
        'Preheat oven to 180°C.',
        'Season chicken with spices.',
        'Place in baking dish.',
        'Top with salsa and cheese.',
        'Bake until cheese is melted.'
      ],
      ingredients: [
        '4 chicken breasts',
        '1 cup salsa',
        '1 cup shredded cheddar',
        '1 tsp cumin',
        '1 tsp chili powder'
      ],
  },
  {
      title: 'Turkey Pasta Dinner',
      imageUrl: '/images/photo11.jpg',
      activeTime: '15 min',
      totalTime: '35 min',
      yield: '4 servings',
      steps: [
        'Cook pasta until al dente.',
        'Brown turkey with onions.',
        'Add sauce and simmer.',
        'Combine with pasta.',
        'Serve hot with grated cheese.'
      ],
      ingredients: [
        '300g pasta',
        '400g ground turkey',
        '1 onion, chopped',
        '2 cups tomato sauce',
        'Parmesan for serving'
      ],
  },
  {
    title: 'Cheesy Broccoli Bake',
    imageUrl: '/images/photo12.jpg',
    activeTime: '10 min',
    totalTime: '40 min',
    yield: '6 servings',
    steps: [
      'Preheat oven to 180°C.',
      'Blanch broccoli florets.',
      'Mix with cheese sauce.',
      'Pour into baking dish.',
      'Bake until golden and bubbly.'
    ],
    ingredients: [
      '500g broccoli florets',
      '1 cup cheddar cheese',
      '1/2 cup cream',
      '2 tbsp butter',
      '1 tbsp flour'
    ],
  },
  {
    title: "Beef's General Tso's Chicken",
    imageUrl: '/images/photo3.jpg',
    activeTime: '25 min',
    totalTime: '50 min',
    yield: '4 servings',
    steps: [
      'Cut chicken into bite-size pieces.',
      'Coat and fry until golden.',
      'Make General Tso’s sauce.',
      'Toss chicken in sauce.',
      'Serve with steamed rice.'
    ],
    ingredients: [
      '500g chicken breast',
      '1/2 cup cornstarch',
      '2 tbsp soy sauce',
      '2 tbsp hoisin sauce',
      '1 tbsp rice vinegar'
    ],
  },
  {
    title: 'Macaroni Sausage Cheddar',
    imageUrl: '/images/photo3.jpg',
    activeTime: '15 min',
    totalTime: '45 min',
    yield: '6 servings',
    steps: [
      'Cook macaroni until al dente.',
      'Brown sausage in a pan.',
      'Make cheesy sauce.',
      'Combine pasta, sausage, and sauce.',
      'Bake until bubbly.'
    ],
    ingredients: [
      '300g macaroni',
      '300g sausage meat',
      '2 cups cheddar cheese',
      '1 cup milk',
      '2 tbsp butter'
    ],
  },
  {
    title: 'Creamy Chicken with Leeks',
    imageUrl: '/images/photo3.jpg',
    activeTime: '20 min',
    totalTime: '1 hr',
    yield: '4 servings',
    steps: [
      'Sauté chicken pieces.',
      'Add sliced leeks.',
      'Pour in cream and simmer.',
      'Season with herbs.',
      'Serve with rice or potatoes.'
    ],
    ingredients: [
      '500g chicken thighs',
      '2 leeks, sliced',
      '200ml cream',
      '1 tbsp olive oil',
      'Fresh thyme'
    ],
  },

    // You can continue the same for the remaining recipes...
  ];

  // 3) Seed into database
  for (const data of recipesData) {
    await prisma.recipe.create({
      data: {
        title: data.title,
        description: `Delicious homemade ${data.title}. Perfect for family dinners!`,
        imageUrl: data.imageUrl,
        activeTime: data.activeTime,
        totalTime: data.totalTime,
        yield: data.yield,
        author: { connect: { id: seedUser.id } },
        steps: {
          create: data.steps.map((text) => ({ text })),
        },
        ingredients: {
          create: data.ingredients.map((name) => ({ name })),
        },
      },
    });
    console.log(`✅ Seeded: ${data.title}`);
  }

  console.log('🎉 Seeding completed.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
