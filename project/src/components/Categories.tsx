import { Home, TreePine, Building2, Ticket, Sparkles } from 'lucide-react';

interface CategoriesProps {
  onCategorySelect: (category: string) => void;
}

const categories = [
  {
    id: 'indoor',
    name: 'Indoor Attractions',
    icon: Home,
    count: 3,
    image: 'https://images.pexels.com/photos/1153976/pexels-photo-1153976.jpeg?auto=compress&cs=tinysrgb&w=400',
  },
  {
    id: 'outdoor',
    name: 'Outdoor Adventures',
    icon: TreePine,
    count: 5,
    image: 'https://images.pexels.com/photos/1320686/pexels-photo-1320686.jpeg?auto=compress&cs=tinysrgb&w=400',
  },
  {
    id: 'museum',
    name: 'Museums',
    icon: Building2,
    count: 4,
    image: 'https://images.pexels.com/photos/2528116/pexels-photo-2528116.jpeg?auto=compress&cs=tinysrgb&w=400',
  },
  {
    id: 'theme',
    name: 'Theme Parks',
    icon: Ticket,
    count: 3,
    image: 'https://images.pexels.com/photos/163696/dubai-mall-dubai-roller-coaster-carousel-163696.jpeg?auto=compress&cs=tinysrgb&w=400',
  },
  {
    id: 'all',
    name: 'All Destinations',
    icon: Sparkles,
    count: 13,
    image: 'https://images.pexels.com/photos/1659438/pexels-photo-1659438.jpeg?auto=compress&cs=tinysrgb&w=400',
  },
];

export default function Categories({ onCategorySelect }: CategoriesProps) {
  return (
    <section id="categories" className="py-20 bg-dark-900">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <p className="text-rust-400 text-xs uppercase tracking-widest mb-4 font-medium">Browse Categories</p>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4 tracking-tight">
            Explore by Category
          </h2>
          <p className="text-base text-white/50 max-w-2xl mx-auto">
            Find the perfect adventure for your weekend
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => onCategorySelect(category.id)}
              className="group relative overflow-hidden rounded-xl aspect-square bg-dark-800 hover:scale-[1.02] transition-all duration-300 border border-white/[0.06] hover:border-rust-500/40"
            >
              <img
                src={category.image}
                alt={category.name}
                className="absolute inset-0 w-full h-full object-cover opacity-30 group-hover:opacity-50 group-hover:scale-105 transition-all duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-dark-900/90 via-dark-900/50 to-transparent"></div>

              <div className="relative h-full flex flex-col items-center justify-center p-6 text-white">
                <div className="w-12 h-12 bg-rust-500/15 backdrop-blur-sm rounded-lg flex items-center justify-center mb-4 group-hover:bg-rust-500 group-hover:scale-105 transition-all border border-rust-500/25">
                  <category.icon className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-semibold mb-2 text-center uppercase tracking-wider">{category.name}</h3>
                <p className="text-xs font-medium text-rust-400">
                  {category.count} Places
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
