"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ProductItem } from "@/app/actions/product-search";
import { ChevronLeft, ChevronRight, ExternalLink } from "lucide-react";

interface ProductCarouselProps {
  products: ProductItem[];
  totalCost: number;
  budget?: number;
}

export function ProductCarousel({
  products,
  totalCost,
  budget,
}: ProductCarouselProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  // Update scroll buttons visibility
  const checkScrollPosition = () => {
    if (!scrollContainerRef.current) return;

    const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
    setCanScrollLeft(scrollLeft > 0);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
  };

  // Attach scroll event listener
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener("scroll", checkScrollPosition);
      // Check initial scroll position
      checkScrollPosition();

      // Check if we can scroll right initially
      setCanScrollRight(container.scrollWidth > container.clientWidth);
    }

    return () => {
      container?.removeEventListener("scroll", checkScrollPosition);
    };
  }, [products]);

  // Handle scroll buttons
  const scroll = (direction: "left" | "right") => {
    if (!scrollContainerRef.current) return;

    const scrollAmount = 320; // Scroll by approximate card width
    const container = scrollContainerRef.current;

    if (direction === "left") {
      container.scrollBy({ left: -scrollAmount, behavior: "smooth" });
    } else {
      container.scrollBy({ left: scrollAmount, behavior: "smooth" });
    }
  };

  if (!products.length) return null;

  return (
    <div className="w-full bg-white border-t shadow-sm product-carousel-animate">
      <div className="p-4 flex justify-between items-center border-b">
        <div className="flex items-center">
          <h3 className="text-lg font-medium">Suggested Products</h3>
          <span className="ml-2 px-2 py-0.5 bg-amber-100 text-amber-800 text-xs font-medium rounded-full">
            {products.length} items
          </span>
        </div>
        <div className="flex items-center">
          <p className="text-sm font-semibold mr-2">Total Estimated Cost:</p>
          <span className="text-lg font-bold text-amber-700">
            ${totalCost.toFixed(2)}
          </span>

          {budget && (
            <div className="ml-3 flex items-center">
              {totalCost <= budget ? (
                <span className="px-2 py-0.5 bg-green-100 text-green-800 text-xs font-medium rounded-full flex items-center">
                  <svg
                    viewBox="0 0 24 24"
                    className="w-3 h-3 mr-1 fill-current"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
                  </svg>
                  Under Budget (${(budget - totalCost).toFixed(2)} left)
                </span>
              ) : (
                <span className="px-2 py-0.5 bg-red-100 text-red-800 text-xs font-medium rounded-full flex items-center">
                  <svg
                    viewBox="0 0 24 24"
                    className="w-3 h-3 mr-1 fill-current"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z" />
                  </svg>
                  Over Budget (${(totalCost - budget).toFixed(2)} over)
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Budget progress bar */}
      {budget && (
        <div className="px-4 pb-2 pt-1">
          <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
            <div
              className={`h-full ${
                totalCost > budget ? "bg-red-500" : "bg-green-500"
              }`}
              style={{
                width: `${Math.min(100, (totalCost / budget) * 100)}%`,
                transition: "width 0.5s ease-out",
              }}
            />
          </div>
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>$0</span>
            <span>Budget: ${budget}</span>
          </div>
        </div>
      )}

      <div className="relative">
        {canScrollLeft && (
          <Button
            onClick={() => scroll("left")}
            size="icon"
            variant="outline"
            className="absolute left-2 top-1/2 transform -translate-y-1/2 z-10 bg-white shadow-md h-8 w-8"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
        )}

        <div
          ref={scrollContainerRef}
          className="flex overflow-x-auto gap-4 px-6 pb-6 scrollbar-hide"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {products.map((product, index) => (
            <div
              key={index}
              className="flex-shrink-0 w-64 bg-white rounded-md border overflow-hidden shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="h-40 relative overflow-hidden bg-gray-100">
                <div className="flex items-center justify-center h-full bg-amber-50 text-amber-800">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="w-12 h-12 opacity-60"
                  >
                    <rect width="18" height="18" x="3" y="3" rx="2" />
                    <circle cx="9" cy="9" r="2" />
                    <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
                  </svg>
                </div>
                {product.quantity > 1 && (
                  <div className="absolute top-2 right-2 bg-amber-500 text-white text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center">
                    x{product.quantity}
                  </div>
                )}
              </div>

              <div className="p-3">
                <h4 className="font-medium line-clamp-2 h-12">
                  {product.item_name}
                </h4>
                <p className="text-sm text-gray-500 my-1 line-clamp-2 h-10">
                  {product.description}
                </p>

                <div className="flex justify-between items-center mt-2">
                  <div>
                    <p className="text-xs text-gray-500">
                      {product.quantity > 1
                        ? `${product.quantity} × $${product.unit_price.toFixed(
                            2
                          )}`
                        : ""}
                    </p>
                    <p className="font-semibold">
                      ${product.total_price.toFixed(2)}
                    </p>
                  </div>

                  <a
                    href={product.source_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center text-sm font-medium text-amber-600 hover:text-amber-700 bg-amber-50 hover:bg-amber-100 px-2 py-1 rounded-md transition-colors"
                  >
                    View <ExternalLink className="h-3 w-3 ml-1" />
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>

        {canScrollRight && (
          <Button
            onClick={() => scroll("right")}
            size="icon"
            variant="outline"
            className="absolute right-2 top-1/2 transform -translate-y-1/2 z-10 bg-white shadow-md h-8 w-8"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        )}
      </div>

      <div className="p-2 text-xs text-center text-gray-500 border-t">
        Products found via Google Search. Prices and availability may vary.
      </div>
    </div>
  );
}
