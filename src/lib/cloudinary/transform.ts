const DELIVERY_TRANSFORMATION = "f_auto,q_auto,c_limit,w_2400,h_2400,dpr_auto";

export function buildOptimizedCloudinaryUrl(cloudName: string, publicId: string) {
  return `https://res.cloudinary.com/${cloudName}/image/upload/${DELIVERY_TRANSFORMATION}/${publicId}`;
}
