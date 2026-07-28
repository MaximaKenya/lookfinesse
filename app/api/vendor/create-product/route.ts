import { NextResponse } from "next/server";

import { supabase } from "@/lib/supabaseClient";

import { createFeedPost } from "@/lib/social/createFeedPost";

import { sendFollowerNotifications } from "@/lib/social/sendFollowerNotifications";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const {
      vendor_id,
      name,
      short_description,
      description,
      category_id,
      price,
      inventory,
      sku,
      shipping_fee,
      images,
      caption,
    } = body;

    if (!vendor_id) {
      return NextResponse.json(
        {
          error: "vendor_id is required",
        },
        {
          status: 400,
        }
      );
    }

    if (!name) {
      return NextResponse.json(
        {
          error: "Product name is required",
        },
        {
          status: 400,
        }
      );
    }

    const primaryImage =
      images?.[0]?.url || null;

    const gallery =
      images?.map(
        (img: { url: string }) => img.url
      ) || [];

    /*
      CREATE PRODUCT
    */

    const {
      data: product,
      error,
    } = await supabase
      .from("products")
      .insert({
        vendor_id,

        name,

        short_description,

        description,

        category_id,

        price: Number(price || 0),

        inventory: Number(
          inventory || 0
        ),

        sku,

        shipping_fee: Number(
          shipping_fee || 0
        ),

        image_url: primaryImage,

        image_gallery: gallery,

        status: "active",
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    /*
      CREATE SOCIAL FEED POST
    */

    const feedPost =
      await createFeedPost({
        vendorId: vendor_id,

        productId: product.id,

        caption:
          caption ||
          short_description ||
          `New drop: ${name}`,

        mediaUrls: gallery,

        thumbnailUrl:
          primaryImage || undefined,
      });

    /*
      NOTIFY FOLLOWERS
    */

    await sendFollowerNotifications({
      vendorId: vendor_id,

      title: "New Product Drop",

      message: `${name} is now available`,

      imageUrl: primaryImage || undefined,
    });

    return NextResponse.json({
      success: true,

      product,

      feedPost,
    });
  } catch (err) {
    console.error(err);

    return NextResponse.json(
      {
        error:
          "Failed to create product",
      },
      {
        status: 500,
      }
    );
  }
}